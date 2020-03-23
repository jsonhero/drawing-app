
const defaultOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  body: null,
}

async function fetchApi(url, options) {
  const mergeOptions = Object.assign({}, defaultOptions, options);
  if (mergeOptions.body) {
    mergeOptions.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, mergeOptions);
    return await response.json();
  } catch(e) {
    console.error(e);
  }
}

export default fetchApi