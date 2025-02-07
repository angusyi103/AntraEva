const API = (() => {
  const URL = 'http://localhost:3000';
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) => Promise.all(data.map((item) => deleteFromCart(item.id))));
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory
      this.#onChange?.();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  // implement your logic for View
  const invListEl = document.querySelector('.inventory__list');
  const cartListEl = document.querySelector('.cart__list');

  const renderCart = (items) => {
    let cartTemp = '';
    items.forEach((item) => {
      console.log('rendercart', item);
      const cartItem = `<li id=${item.id}>
              <span>${item.content} x ${item.cnt}</span>
              <button class="item__delete-btn">delete</button>
              <button class="item__edit-btn">edit</button>
            </li>`;
      cartTemp += cartItem;
    });

    cartListEl.innerHTML = cartTemp;
  };

  const renderInventory = (items, handleQuantityChange, handleAddToCart) => {
    console.log('renderInventory', items);
    let inventoryTemp = '';
    items.forEach((item) => {
      const invItem = `<li id=${item.id}>
              <span>${item.content}</span>
              <button class="item__delete-btn" data-id="${item.id}"> - </button>
              <span>${item.cnt}</span>
              <button class="item__add-btn" data-id="${item.id}">+</button>
              <button class="item__add-to-cart-btn" data-id="${item.id}">add to cart</button>
            </li>`;
      inventoryTemp += invItem;
    });

    invListEl.innerHTML = inventoryTemp;

    const addButtons = document.querySelectorAll('.item__add-btn');
    addButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.getAttribute('data-id'));
        handleQuantityChange(itemId, 'increment');
      });
    });

    const subtractButtons = document.querySelectorAll('.item__delete-btn');
    subtractButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.getAttribute('data-id'));
        handleQuantityChange(itemId, 'decrement');
      });
    });

    const addToCartButtons = document.querySelectorAll('.item__add-to-cart-btn');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.getAttribute('data-id'));
        handleAddToCart(itemId)
      });
    });
  };

  return {
    renderCart,
    renderInventory,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleQuantityChange = (itemId, operation) => {
    const item = state.inventory.find((item) => item.id === itemId);
    // console.log('handleQuantityChange', item)
    if (item) {
      if (operation === 'increment') {
        item.cnt += 1;
      } else if (operation === 'decrement' && item.cnt > 0) {
        item.cnt -= 1;
      }
      state.inventory = [...state.inventory];
    }
  };

  const handleAddToCart = (itemId) => {
    const item = state.inventory.find((item) => item.id === itemId);
    if (item) {
      API.addToCart({ name: item.content, quantity: item.cnt });
      item.cnt = 0;
    }
  };

  const handleEdit = () => {};

  const handleEditAmount = () => {};

  const handleDelete = () => {};

  const handleCheckout = () => {};

  const init = () => {
    state.subscribe(() => {
      View.renderCart(state.cart);
      View.renderInventory(state.inventory, handleQuantityChange, handleAddToCart);
    });

    API.getCart().then((data) => {
      console.log('cart', data);
      state.cart = data;
    });

    API.getInventory().then((data) => {
      console.log('inventory', data);
      state.inventory = data;
    });
  };

  return {
    init,
  };
})(Model, View, API);

Controller.init();
