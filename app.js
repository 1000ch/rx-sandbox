const domready = Rx.Observable.fromEvent(document, 'DOMContentLoaded');

domready.subscribe(e => {
  const input = document.querySelector('input');
  const ul = document.querySelector('ul');
  const list = ul.getElementsByTagName('li');

  Rx.Observable.fromEvent(input, 'keyup')
    .debounce(100)
    .filter(e => e.keyCode === 13)
    .filter(e => e.shiftKey)
    .pluck('target', 'value')
    .subscribe(value => {
      let li = document.createElement('li');
      li.textContent = value;
      ul.appendChild(li);
    });
});
