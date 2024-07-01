import {
  Kind,
  type DocumentNode,
  type OperationDefinitionNode,
  print,
} from "graphql";
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from "wonka";
import {
  type Exchange,
  type Operation,
  type OperationResult,
  makeResult,
  makeErrorResult,
} from "@urql/core";

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

type UploadFileType = File;

interface ExtractedFile {
  file: UploadFileType | UploadFileType[];
  name: string;
}

function isUploadFile(value: any): value is UploadFileType {
  return typeof File !== "undefined" && value instanceof File;
}

function isObject(value: any) {
  return value !== null && typeof value === "object";
}

function isFileList(value: any): value is FileList {
  return typeof FileList !== "undefined" && value instanceof FileList;
}

type IsUploadFileType = typeof isUploadFile;

const extractFiles = (
  variables: object,
  isUploadFile: IsUploadFileType
): { variables: object; files: ExtractedFile[] } => {
  const files: ExtractedFile[] = [];
  const walkTree = (
    tree: any[] | object,
    path: string[] = []
  ): any[] | object => {
    const mapped: any = Array.isArray(tree) ? [...tree] : { ...tree };
    Object.keys(mapped).forEach((key) => {
      const value = mapped[key];
      if (isUploadFile(value) || isFileList(value)) {
        const name = [...path, key].join(".");
        const file = isFileList(value)
          ? Array.prototype.slice.call(value)
          : value;
        files.push({ file, name });
        mapped[key] = name;
      } else if (isObject(value)) {
        mapped[key] = walkTree(value, [...path, key]);
      }
    });
    return mapped;
  };

  return {
    files,
    variables: walkTree(variables),
  };
};

const executeFetch = (
  operation: Operation,
  opts: RequestInit
): Promise<OperationResult | undefined> => {
  const { url, fetch: fetcher } = operation.context;
  let statusNotOk = false;
  let response: Response;

  return (fetcher || fetch)(url, opts)
    .then((res: Response) => {
      response = res;
      statusNotOk =
        res.status < 200 ||
        res.status >= (opts.redirect === "manual" ? 400 : 300);
      return res.json();
    })
    .then((result: any) => {
      if (!("data" in result) && !("errors" in result)) {
        throw new Error("No Content");
      }

      return makeResult(operation, result, response);
    })
    .catch((error: Error) => {
      if (error.name !== "AbortError") {
        return makeErrorResult(
          operation,
          statusNotOk ? new Error(response.statusText) : error,
          response
        );
      }
    });
};

const getOperationName = (query: DocumentNode): string | null => {
  const node = query.definitions.find(
    (node: any): node is OperationDefinitionNode => {
      return node.kind === Kind.OPERATION_DEFINITION && node.name;
    }
  );

  return node && node.name ? node.name.value : null;
};

export const convertToGet = (uri: string, body: Body): string => {
  const queryParams: string[] = [`query=${encodeURIComponent(body.query)}`];

  if (body.variables) {
    queryParams.push(
      `variables=${encodeURIComponent(JSON.stringify(body.variables))}`
    );
  }

  return uri + "?" + queryParams.join("&");
};

const createFetchSource = (operation: Operation, shouldUseGet: boolean) => {
  if (
    process.env.NODE_ENV !== "production" &&
    operation.kind === "subscription"
  ) {
    throw new Error(
      "Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?"
    );
  }

  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== "undefined"
        ? new AbortController()
        : undefined;

    const { context } = operation;
    // We have to make sure the operation is fully spread in here so we don't lose the query on our cloned object.
    // Spreading operation.variables here in case someone made a variables with Object.create(null).
    const { files, variables } = extractFiles(
      operation.variables || {},
      isUploadFile
    );

    const extraOptions =
      typeof context.fetchOptions === "function"
        ? context.fetchOptions()
        : context.fetchOptions || {};

    const operationName = getOperationName(operation.query);

    const body: Body = {
      query: print(operation.query),
      variables: operation.variables,
    };

    if (operationName !== null) {
      body.operationName = operationName;
    }
    const fetchOptions = {
      ...extraOptions,
      method: shouldUseGet ? "GET" : "POST",
      headers: extraOptions.headers
        ? {
            "content-type": "application/json",
            ...extraOptions.headers,
          }
        : undefined,
      signal: abortController?.signal,
    };

    if (files.length) {
      const formData = new FormData();
      fetchOptions.method = "POST";
      // Make fetch auto-append this for correctness
      // @ts-expect-error
      delete fetchOptions.headers["content-type"];

      formData.append("query", body.query);
      formData.append("variables", JSON.stringify(variables));

      files.forEach(({ name, file }) => {
        formData.append(name, file as any);
      });
      fetchOptions.body = formData;
    } else if (shouldUseGet) {
      operation.context.url = convertToGet(operation.context.url, body);
    } else {
      fetchOptions.body = JSON.stringify(body);
    }

    let ended = false;

    Promise.resolve()
      .then(() => (ended ? undefined : executeFetch(operation, fetchOptions)))
      .then((result: OperationResult | undefined) => {
        if (!ended) {
          ended = true;
          if (result) next(result);
          complete();
        }
      });

    return () => {
      ended = true;
      if (abortController !== undefined) {
        abortController.abort();
      }
    };
  });
};

const isOperationFetchable = (operation: Operation) =>
  operation.kind === "query" || operation.kind === "mutation";

export const absintheMultipartFetchExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    const sharedOps$ = share(ops$);

    const fetchResults$ = pipe(
      sharedOps$,
      filter(isOperationFetchable),
      mergeMap((operation: Operation) => {
        const teardown$ = pipe(
          sharedOps$,
          filter(
            (op: Operation) =>
              op.kind === "teardown" && op.key === operation.key
          )
        );

        return pipe(
          createFetchSource(
            operation,
            operation.kind === "query" && !!operation.context.preferGetMethod
          ),
          takeUntil(teardown$)
        );
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter((op: Operation) => !isOperationFetchable(op)),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
