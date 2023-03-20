import { settings, select } from './settings';
import Product from './components/Product';
import Cart from './components/Cart';

const app = {
  initData: function () {
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url)
      .then(function (response) {
        return response.json();
      })
      .then(function (responseBody) {
        console.log('responseBody', responseBody);

        thisApp.data.products = responseBody;

        thisApp.initMenu();
      });
    console.log('this.data', JSON.stringify(thisApp.data));
  },

  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product.prepareCartProduct());
    });
  },

  initMenu: function () {
    const thisApp = this;

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  init: function () {
    const thisApp = this;

    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();