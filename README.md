# urql-absinthe-upload-exchange

[![npm version](https://img.shields.io/npm/v/urql-absinthe-upload-exchange.svg)](https://www.npmjs.com/package/urql-absinthe-upload-exchange)
[![npm downloads](https://img.shields.io/npm/dm/urql-absinthe-upload-exchange.svg)](https://www.npmjs.com/package/urql-absinthe-upload-exchange)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/urql-absinthe-upload-exchange.svg)](https://nodejs.org)

Urql exchange to support file uploads to an (Elixir) Absinthe backend

## Features

- 📁 File upload support for urql GraphQL client
- 🔄 Compatible with Absinthe backends (Phoenix/Elixir)
- ✅ Support for both ESM and CommonJS imports
- 🔍 TypeScript type definitions included

## Requirements

- Node.js >= 18.0.0
- urql ^5.0.0 (peer dependency)

## Installation

```bash
# npm
npm install urql-absinthe-upload-exchange

# yarn
yarn add urql-absinthe-upload-exchange

# pnpm
pnpm add urql-absinthe-upload-exchange
```

## Usage

Add the exchange to your urql client, right before the fetch exchange:

```javascript
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import absintheUploadExchange from 'urql-absinthe-upload-exchange';

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [dedupExchange, cacheExchange, absintheUploadExchange, fetchExchange],
});
```

### Example with file upload

```vue
<script setup>
import { ref } from 'vue';
import { useMutation } from '@urql/vue';

const UploadDocument = `
  mutation($file: Upload!) {
    uploadFile(file: $file) {
      id
      url
    }
  }
`;

// Create a mutation hook
const { executeMutation, fetching, data, error } = useMutation(UploadDocument);

// File upload handling
const fileInput = ref(null);
const uploadedFileUrl = ref('');

const handleFileUpload = async () => {
  const file = fileInput.value?.files[0];
  if (!file) return;
  
  try {
    const result = await executeMutation({ file });
    if (result.data?.uploadFile?.url) {
      uploadedFileUrl.value = result.data.uploadFile.url;
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
};
</script>

<template>
  <div>
    <h2>File Upload</h2>
    <input 
      type="file" 
      ref="fileInput"
      @change="handleFileUpload"
    />
    
    <div v-if="fetching" class="status">
      Uploading file...
    </div>
    
    <div v-else-if="error" class="error">
      Upload failed: {{ error.message }}
    </div>
    
    <div v-else-if="uploadedFileUrl" class="success">
      File uploaded successfully!<br>
      URL: {{ uploadedFileUrl }}
    </div>
  </div>
</template>
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgements

This project is based on code originally provided by [Harry Grumbar](https://github.com/harrygr) in [this gist](https://gist.github.com/harrygr). Used with permission.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request
