import Entity from './Entity';

export default class ChatAPI extends Entity {
  constructor() {
    super(`${process.env.API_URL}/new-user`);
  }
}
