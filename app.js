class Database {
  constructor(storeName, keyPath) {
    this.database = null;
    this.storeName = storeName;
    this.keyPath = keyPath;
  }

  get db() {
    if (!this.database) {
      let request = indexedDB.open('rx-sandbox', 1);

      return new Promise((resolve, reject) => {
        request.addEventListener('upgradeneeded', e => {
          this.database = e.target.result;

          if (this.database.objectStoreNames.contains(this.storeName)) {
            this.database.deleteObjectStore(this.storeName);
          }

          this.database.createObjectStore(this.storeName, {
            keyPath       : this.keyPath,
            autoIncrement : true
          });

          resolve(this.database);
        });

        request.addEventListener('success', e => {
          this.database = e.target.result;

          resolve(this.database);
        });

        request.addEventListener('error', e => {
          reject(e);
        });
      });
    }

    return Promise.resolve(this.database);
  }

  get() {
    return new Promise((resolve, reject) => {
      this.db.then(database => {
        let transaction = database.transaction([this.storeName], 'read');
        let store = transaction.objectStore(this.storeName);
        let range = IDBKeyRange.lowerBound(0);
        let request = store.openCursor(range);
        request.addEventListener('success', e => resolve(e));
        request.addEventListener('error', e => reject(e));
      });
    });
  }

  put(data) {
    return new Promise((resolve, reject) => {
      this.db.then(database => {
        let transaction = database.transaction([this.storeName], 'readwrite');
        let store = transaction.objectStore(this.storeName);
        transaction.addEventListener('complete', () => resolve());
        transaction.addEventListener('error', e => reject(e));
        store.put(data);
      });
    });
  }
}

const domready = Rx.Observable.fromEvent(document, 'DOMContentLoaded');

domready.subscribe(e => {
  const input = document.querySelector('input');
  const ul = document.querySelector('ul');
  const list = ul.getElementsByTagName('li');
  const database = new Database('todo', 'timestamp');

  Rx.Observable.fromEvent(input, 'keyup')
    .debounce(100)
    .filter(e => e.keyCode === 13)
    .filter(e => e.shiftKey)
    .pluck('target', 'value')
    .subscribe(value => {
      let data = {
        text      : value,
        timestamp : Date.now()
      };

      database.put(data).then(() => {
        let li = document.createElement('li');
        li.textContent = data.text;
        ul.appendChild(li);
      });
    });
});
