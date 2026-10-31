const createRequest = async (options) => {
  const { url, method = 'GET', data } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
};

export default createRequest;
