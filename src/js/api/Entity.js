import createRequest from './createRequest';

export default class Entity {
  constructor(url) {
    this.url = url;
  }

  list() {
    return createRequest({ url: this.url });
  }

  get(id) {
    return createRequest({ url: `${this.url}/${id}` });
  }

  create(data) {
    return createRequest({
      url: this.url,
      method: 'POST',
      data,
    });
  }

  update(id, data) {
    return createRequest({
      url: `${this.url}/${id}`,
      method: 'PUT',
      data,
    });
  }

  delete(id) {
    return createRequest({
      url: `${this.url}/${id}`,
      method: 'DELETE',
    });
  }
}
