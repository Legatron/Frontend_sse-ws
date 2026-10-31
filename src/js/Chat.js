import ChatAPI from './api/ChatAPI';

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.user = null;
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
  }

  bindToDOM() {
    this.container.innerHTML = `
      <!-- Модальное окно входа -->
      <div class="modal__form active" id="modal">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Выберите псевдоним</div>
          <div class="modal__body">
            <form class="form" id="modal-form">
              <div class="form__group">
                <input class="form__input" type="text" name="nickname" required autocomplete="off">
                <div class="form__hint hidden" id="modal-hint"></div>
              </div>
              <div class="modal__footer">
                <button class="modal__ok" type="submit">Продолжить</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Окно чата -->
      <div class="container hidden" id="chat-container">
        <h1 class="chat__header">Чат</h1>
        <div class="chat__container">
          <!-- Список участников (слева) -->
          <div class="chat__userlist" id="userlist"></div>
          
          <!-- Область сообщений (справа) -->
          <div class="chat__area">
            <div class="chat__messages-container" id="messages-container"></div>
            <div class="chat__messages-input">
              <form class="form" id="message-form">
                <input class="form__input" type="text" name="message" placeholder="Type your message here" required autocomplete="off">
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.modal = this.container.querySelector('#modal');
    this.modalForm = this.container.querySelector('#modal-form');
    this.modalHint = this.container.querySelector('#modal-hint');
    this.chatContainer = this.container.querySelector('#chat-container');
    this.messagesContainer = this.container.querySelector('#messages-container');
    this.messageForm = this.container.querySelector('#message-form');
    this.userlist = this.container.querySelector('#userlist');
  }

  registerEvents() {
    this.modalForm.addEventListener('submit', this.onEnterChatHandler.bind(this));
    this.messageForm.addEventListener('submit', this.sendMessage.bind(this));

    window.addEventListener('beforeunload', () => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.user) {
        this.websocket.send(JSON.stringify({ type: 'exit', user: this.user }));
      }
    });
  }

  subscribeOnEvents() {
    this.websocket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      if (Array.isArray(data)) {
        this.updateUserList(data);
      } else if (data && data.type === 'send') {
        this.renderMessage(data);
      }
    });
  }

  async onEnterChatHandler(event) {
    event.preventDefault();
    const formData = new FormData(this.modalForm);
    const name = formData.get('nickname').trim();

    if (!name) return;

    try {
      const response = await this.api.create({ name });

      if (response.status === 'ok') {
        this.user = response.user;
        this.modal.classList.remove('active');
        this.chatContainer.classList.remove('hidden');

        this.websocket = new WebSocket(process.env.WS_URL);
        this.subscribeOnEvents();
      } else if (response.status === 'error') {
        this.modalHint.textContent = response.message;
        this.modalHint.classList.remove('hidden');
      }
    } catch (error) {
      this.modalHint.textContent = 'Ошибка соединения с сервером.';
      this.modalHint.classList.remove('hidden');
    }
  }

  sendMessage(event) {
    event.preventDefault();
    const formData = new FormData(this.messageForm);
    const message = formData.get('message').trim();

    if (!message || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const msgData = {
      type: 'send',
      message, // ← исправлено: сокращенная запись
      user: this.user,
    };

    this.websocket.send(JSON.stringify(msgData));
    this.messageForm.reset();
  }

  updateUserList(users) {
    this.userlist.innerHTML = '';

    users.forEach((user) => {
      const userEl = document.createElement('div');
      userEl.className = 'chat__user';

      const avatarEl = document.createElement('div');
      avatarEl.className = 'chat__user-avatar';

      const nameEl = document.createElement('span');
      nameEl.className = 'chat__user-name';

      if (user.id === this.user.id) {
        nameEl.textContent = 'You';
        nameEl.style.color = '#e91616';
      } else {
        nameEl.textContent = user.name;
      }

      userEl.append(avatarEl, nameEl);
      this.userlist.appendChild(userEl);
    });
  }

  renderMessage(msg) {
    const isOwn = msg.user.id === this.user.id;

    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('ru-RU');

    const messageEl = document.createElement('div');
    messageEl.className = `message__container ${
      isOwn ? 'message__container-yourself' : 'message__container-interlocutor'
    }`;

    const headerEl = document.createElement('div');
    headerEl.className = 'message__header';
    headerEl.textContent = `${isOwn ? 'You' : msg.user.name}, ${time} ${date}`;

    const textEl = document.createElement('div');
    textEl.className = 'message__text';
    textEl.textContent = msg.message;

    messageEl.append(headerEl, textEl);
    this.messagesContainer.appendChild(messageEl);

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
