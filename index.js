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
    return fetch(`${URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: newAmount }),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json());
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
      this.#inventory = newInventory;
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

  const renderCart = (items, handleEdit, handleEditAmount, handleDelete) => {
    let cartTemp = '';
    items.forEach((item) => {
      console.log('rendercart', item);
      const cartItem = `<li id=${item.id}>
              <span>${item.name} x ${item.quantity}</span>
              <button class="item__delete-btn" data-id="${item.id}">delete</button>
              <button class="item__edit-btn" data-id="${item.id}">edit</button>
            </li>`;
      cartTemp += cartItem;
    });

    cartListEl.innerHTML = cartTemp;

    const deleteButton = document.querySelectorAll('.item__delete-btn');
    deleteButton.forEach((button) => {
      button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.getAttribute('data-id'));
        handleDelete(itemId);
      });
    });

    const editButton = document.querySelectorAll('.item__edit-btn');
    editButton.forEach((button) => {
      button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.getAttribute('data-id'));
        const cartItemElement = document.getElementById(itemId);
        const itemName = cartItemElement.querySelector('span').textContent.split(' x ')[0];
        const currentQuantity = parseInt(cartItemElement.querySelector('span').textContent.split(' x ')[1]);

        cartItemElement.innerHTML = `
          <span>${itemName}</span>
          <button class="item__subtract-btn" data-id="${itemId}" id="cart-sub">-</button>
          <span class="quantity__amount">${currentQuantity}</span>
          <button class="item__add-btn" data-id="${itemId}" id="cart-add"> + </button>
          <button class="item__save-btn" data-id="${itemId}">save</button>
        `;

        cartItemElement.querySelector('#cart-add').addEventListener('click', () => {
          const quantityElement = cartItemElement.querySelector('.quantity__amount');
          quantityElement.textContent = parseInt(quantityElement.textContent) + 1;
        });

        cartItemElement.querySelector('#cart-sub').addEventListener('click', () => {
          const quantityElement = cartItemElement.querySelector('.quantity__amount');
          let newQuantity = Math.max(0, parseInt(quantityElement.textContent) - 1);
          quantityElement.textContent = newQuantity;
        });

        cartItemElement.querySelector('.item__save-btn').addEventListener('click', () => {
          const newAmount = parseInt(cartItemElement.querySelector('.quantity__amount').textContent);
          handleEditAmount(itemId, newAmount);
        });
      });
    });
  };

  const renderInventory = (items, handleQuantityChange, handleAddToCart) => {
    // console.log('renderInventory', items);
    let inventoryTemp = '';
    items.forEach((item) => {
      const invItem = `<li id=${item.id}>
              <span>${item.content}</span>
              <button class="item__subtract-btn" data-id="${item.id}"> - </button>
              <span>${item.cnt}</span>
              <button class="item__add-btn" data-id="${item.id}"> + </button>
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

    const subtractButtons = document.querySelectorAll('.item__subtract-btn');
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
        handleAddToCart(itemId);
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

  const handleEditAmount = (itemId, newAmount) => {
    const item = state.cart.find((item) => item.id === itemId);
    if (item) {
      item.cnt = Math.max(0, newAmount);
      state.cart = [...state.cart];
    }
  };

  const handleDelete = (itemId) => {
    const item = state.cart.find((item) => item.id === itemId);
    if (item) {
      API.deleteFromCart(itemId);
    }
  };

  const handleCheckout = () => {
    console.log('Checkout process initiated');
    // You can add more functionality here, like processing payment, etc.
  };

  const init = () => {
    state.subscribe(() => {
      View.renderCart(state.cart, handleEdit, handleEditAmount, handleDelete);
      View.renderInventory(state.inventory, handleQuantityChange, handleAddToCart);
    });

    API.getCart().then((data) => {
      // console.log('cart', data);
      state.cart = data;
    });

    API.getInventory().then((data) => {
      // console.log('inventory', data);
      state.inventory = data;
    });
  };

  return {
    init,
  };
})(Model, View, API);

Controller.init();

document.addEventListener('DOMContentLoaded', () => {
  const checkoutButton = document.querySelector('.checkout-btn');
  checkoutButton.addEventListener('click', Controller.handleCheckout);
});
