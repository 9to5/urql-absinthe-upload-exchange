# urql-absinthe-upload-exchange

Urql exchange to support file uploads to an (Elixir) Absinthe backend

## Usage

Install the package:

```bash
npm install urql-absinthe-upload-exchange
```

Add the exchange to your urql client, right before the fetch exchange:

```javascript
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { uploadExchange } from 'urql-absinthe-upload-exchange';

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [dedupExchange, cacheExchange, uploadExchange, fetchExchange],
});
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgements

This project is based on code originally provided by [Harry Grumbar](https://github.com/harrygr) in [this gist](https://gist.github.com/harrygr). Used with permission.
