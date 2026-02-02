import { Message } from '../../api/types';

export class MessageItem {
  private element: HTMLElement;

  constructor(
    private message: Message,
    private isCurrentUser: boolean,
    private onDelete?: (messageId: string) => void,
    private onEdit?: (messageId: string, newText: string) => void
  ) {
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'message-item ' + (this.isCurrentUser ? 'own' : 'other');
    this.element.dataset.messageId = this.message.id;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const senderName = document.createElement('span');
    senderName.className = 'message-sender';
    senderName.textContent = this.isCurrentUser ? 'Вы' : this.message.from;

    const time = document.createElement('span');
    time.className = 'message-time';
    const date = new Date(this.message.datetime);
    time.textContent = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    messageHeader.appendChild(senderName);
    messageHeader.appendChild(time);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (this.message.status.isDeleted) {
      const deletedText = document.createElement('div');
      deletedText.className = 'message-text deleted';
      deletedText.textContent = 'Сообщение удалено';
      messageContent.appendChild(deletedText);
    } else {
      const messageText = document.createElement('div');
      messageText.className = 'message-text';
      messageText.textContent = this.message.text;

      if (this.message.status.isEdited) {
        const editedBadge = document.createElement('span');
        editedBadge.className = 'message-edited';
        editedBadge.textContent = ' (изменено)';
        messageText.appendChild(editedBadge);
      }

      messageContent.appendChild(messageText);
    }

    const messageFooter = document.createElement('div');
    messageFooter.className = 'message-footer';

    if (this.isCurrentUser) {
      const statusContainer = document.createElement('div');
      statusContainer.className = 'message-status-container';

      const statusIcon = document.createElement('span');
      statusIcon.className = 'message-status-icon';
      
      if (this.message.status.isReaded) {
        statusIcon.textContent = '✓✓';
        (statusIcon as HTMLElement).title = 'Прочитано';
      } else if (this.message.status.isDelivered) {
        statusIcon.textContent = '✓';
        (statusIcon as HTMLElement).title = 'Доставлено';
      } else {
        statusIcon.textContent = '⏳';
        (statusIcon as HTMLElement).title = 'Отправляется';
      }

      statusContainer.appendChild(statusIcon);
      messageFooter.appendChild(statusContainer);

      if (!this.message.status.isDeleted) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message-actions';

        const editButton = document.createElement('button');
        editButton.textContent = '✎';
        editButton.className = 'message-action-button';
        (editButton as HTMLElement).title = 'Редактировать';
        editButton.addEventListener('click', () => this.handleEdit());

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑';
        deleteButton.className = 'message-action-button';
        (deleteButton as HTMLElement).title = 'Удалить';
        deleteButton.addEventListener('click', () => {
          if (this.onDelete) {
            this.onDelete(this.message.id);
          }
        });

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);
        messageFooter.appendChild(actionsContainer);
      }
    }

    this.element.appendChild(messageHeader);
    this.element.appendChild(messageContent);
    this.element.appendChild(messageFooter);

    return this.element;
  }

  private handleEdit(): void {
    const newText = prompt('Редактировать сообщение:', this.message.text);
    if (newText !== null && newText.trim() !== '' && this.onEdit) {
      this.onEdit(this.message.id, newText.trim());
    }
  }

  updateStatus(isDelivered: boolean, isReaded: boolean): void {
    this.message.status.isDelivered = isDelivered;
    this.message.status.isReaded = isReaded;
    
    const statusIcon = this.element.querySelector('.message-status-icon');
    if (statusIcon) {
      if (isReaded) {
        statusIcon.textContent = '✓✓';
        (statusIcon as HTMLElement).title = 'Прочитано';
      } else if (isDelivered) {
        statusIcon.textContent = '✓';
        (statusIcon as HTMLElement).title = 'Доставлено';
      }
    }
  }

  updateText(newText: string, isEdited: boolean): void {
    this.message.text = newText;
    this.message.status.isEdited = isEdited;
    
    const messageText = this.element.querySelector('.message-text');
    if (messageText) {
      messageText.textContent = newText;
      
      if (isEdited) {
        const editedBadge = document.createElement('span');
        editedBadge.className = 'message-edited';
        editedBadge.textContent = ' (изменено)';
        messageText.appendChild(editedBadge);
      }
    }
  }

  markAsDeleted(): void {
    this.message.status.isDeleted = true;
    this.render();
  }
}
