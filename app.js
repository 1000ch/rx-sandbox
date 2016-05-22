class Database {
  constructor(storeName, keyPath) {
    this.database = null;
    this.databaseName = 'rx-sandbox';
    this.storeName = storeName;
    this.keyPath = keyPath;
  }

  get db() {
    if (!this.database) {
      let request = indexedDB.open(this.databaseName, 1);

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
        let transaction = database.transaction([this.storeName], 'readonly');
        let store = transaction.objectStore(this.storeName);
        let request = store.openCursor();
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

  delete() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.deleteDatabase(this.databaseName);
      request.addEventListener('success', e => resolve(e));
      request.addEventListener('error', e => reject(e));
    });
  }
}

const domready = Rx.Observable.fromEvent(document, 'DOMContentLoaded');

domready.subscribe(e => {
  const input = document.querySelector('input');
  const ul = document.querySelector('ul');
  const list = ul.getElementsByTagName('li');
  const database = new Database('todo', 'timestamp');

  function addItem(text) {
    let li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  }

  database.get().then(e => {
    let result = e.target.result;
    if (result) {
      addItem(result.value.text);
      result.continue();
    }
  });

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
        addItem(data.text);
      });
    });
});
