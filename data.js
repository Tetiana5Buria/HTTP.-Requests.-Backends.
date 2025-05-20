const TAG = {
  TABLE: "table",
  TR: "tr",
  TD: "td",
  TH: "th",
  THEAD: "thead",
  TBODY: "tbody",
  NUMBER: "№",
};

function DataTable(config) {
  const parentElement = document.querySelector(config.parent);
  parentElement.innerHTML = "";

  const table = document.createElement(TAG.TABLE);
  table.classList.add("data-table");
  table.appendChild(createHeader(config));
  const tbody = document.createElement(TAG.TBODY);
  table.appendChild(tbody);
  parentElement.appendChild(table);
  addButtonAboveTable(config, table);

  fetchData(config.apiUrl)
    .then((data) => fillTableBody(tbody, config, data))
    .catch((error) => console.error("Error:", error.message));
}

async function fetchData(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Error load data");

    const { data } = await response.json();

    if (Array.isArray(data)) {
      return data.map((item, index) => {
        return { id: item.id || String(index + 1), ...item }; //...item is a spread operator that
        // copies all the properties of the item object into a new object.
      });
    } else {
      return Object.entries(data).map(([id, item]) => {
        return { id, ...item };
      });
    }
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

function createHeader(config) {
  const thead = document.createElement(TAG.THEAD);
  const headerRow = document.createElement(TAG.TR);
  appendCell(headerRow, TAG.TH, TAG.NUMBER);
  for (let i = 0; i < config.columns.length; i++) {
    appendCell(headerRow, TAG.TH, config.columns[i].title);
  }
  appendCell(headerRow, TAG.TH, "Дії");
  thead.appendChild(headerRow);
  return thead;
}

function appendCell(row, tag, content, isHTML = false) {
  const cell = document.createElement(tag);
  if (isHTML) {
    cell.innerHTML = content;
  } else {
    cell.textContent = content;
  }
  row.appendChild(cell);
}

function fillTableBody(tbody, config, data) {
  tbody.innerHTML = "";

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const row = document.createElement(TAG.TR);
    appendCell(row, TAG.TD, index + 1);

    for (let i = 0; i < config.columns.length; i++) {
      const col = config.columns[i];
      let value;
      if (typeof col.value === "function") {
        value = col.value(item);
      } else {
        value = item[col.value] || "";
      }
      appendCell(row, TAG.TD, value, typeof col.value === "function");
    }

    const actionButtonDelete = document.createElement(TAG.TD);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Видалити";
    deleteButton.classList.add("data-id");
    actionButtonDelete.appendChild(deleteButton);
    row.appendChild(actionButtonDelete);
    deleteButton.onclick = function () {
      const id = item.id;
      if (id) {
        deleteItem(id, config);
      } else {
        console.error("No ID found for item:", item);
      }
    };

    tbody.appendChild(row);
  }
}

function addButtonAboveTable(config, table) {
  const parentElement = document.querySelector(config.parent);
  const addButton = document.createElement("button");
  addButton.textContent = "Додати";
  addButton.classList.add("add-button");
  parentElement.insertBefore(addButton, table);

  addButton.onclick = () => {
    showAddModal(config);
  };
}
// Головна функція для показу модального вікна
function showAddModal(config) {
  const modal = createModal();
  const modalContent = createModalContent(modal);
  const form = createForm(config);

  modalContent.appendChild(form);
  document.body.appendChild(modal);

  handleModalClose(modal);
  handleFormSubmit(form, modal, config);
}

// Функція для створення модального контейнера
function createModal() {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  return modal;
}

// Функція для створення контенту модального вікна
function createModalContent(modal) {
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  modal.appendChild(modalContent);
  return modalContent;
}

// Функція для створення форми
function createForm(config) {
  const form = document.createElement("form");

  config.columns.forEach((col) => {
    createInputGroups(col).forEach((inputGroup) => {
      form.appendChild(inputGroup);
    });
  });

  const submitButton = createSubmitButton();
  form.appendChild(submitButton);

  return form;
}

// Функція для створення групи інпутів
function createInputGroups(column) {
  let inputs;
  if (Array.isArray(column.input)) {
    inputs = column.input;
  } else {
    inputs = [column.input];
  }

  const inputGroups = [];

  for (let i = 0; i < inputs.length; i++) {
    const inputConfig = inputs[i];

    const inputGroup = document.createElement("div");
    inputGroup.classList.add("input-group");

    const label = document.createElement("label");
    label.textContent = inputConfig.label || column.title;
    inputGroup.appendChild(label);

    const input = createInputElement(inputConfig, column);
    inputGroup.appendChild(input);

    // Додаємо перевірку для обов'язкових полів
    if (inputConfig.required) {
      if (!input.value) {
        input.style.border = "1px solid red";
      }

      input.addEventListener("input", () => {
        if (input.value) {
          input.style.border = "";
        } else {
          input.style.border = "1px solid red";
        }
      });
    }

    addEnterKeyListener(input, inputGroup.parentNode);

    inputGroups.push(inputGroup);
  }

  return inputGroups;
}



// Function to create input
function createInputElement(inputConfig, column) {
  let input;
  if (inputConfig.type === "select" && inputConfig.options) {
    input = document.createElement("select");
    inputConfig.options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      input.appendChild(option);
    });
  } else {
    input = document.createElement("input");
    input.type = inputConfig.type || "text";
  }

  input.name = inputConfig.name || column.value;
  input.required = inputConfig.required !== false;


  Object.keys(inputConfig).forEach((key) => {
    if (key !== "options" && key !== "label") {
      input[key] = inputConfig[key];
    }
  });

  return input;
}

// Додавання обробника натискання Enter
function addEnterKeyListener(input, form) {
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });
}

// Функція для створення кнопки "Додати"
function createSubmitButton() {
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Додати";
  return button;
}



// Обробник закриття модального вікна
function handleModalClose(modal) {
  modal.onclick = (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

// Обробник відправки форми
function handleFormSubmit(form, modal, config) {
  form.onsubmit = async (event) => {
    event.preventDefault();

    const { newItem, isValid } = validateForm(form);

    if (isValid) {
      try {
        await createNewElement(config.apiUrl, newItem);
        alert("Changes are successful");
        setTimeout(() => document.body.removeChild(modal), 1000);
        DataTable(config);
      } catch (error) {
        console.error("Error creating item:", error);
      }
    }
  };
}

// Перевірка заповнення форми (тільки збір даних, без перевірки обов'язкових полів)
function validateForm(form) {
  const newItem = {};
  let isValid = true;

  form.querySelectorAll("input, select").forEach((input) => {
    newItem[input.name] = input.value;
  });

  return { newItem, isValid };
}


async function createNewElement(apiUrl, item) {
  try {
    const processedItem = { ...item };
    if (processedItem.price) {
      processedItem.price = parseFloat(processedItem.price) || 0;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processedItem),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create item: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating item:", error.message);
    throw error;
  }
}


function getAge(birthday) {
  const birthDate = new Date(birthday);
  const currentDate = new Date();
  let years = currentDate.getFullYear() - birthDate.getFullYear();
  let months = currentDate.getMonth() - birthDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }
  const yearNote = years % 10 === 1 && years % 100 !== 11 ? "year" : "years";
  const monthNote =
    months % 10 === 1 && months % 100 !== 11 ? "month" : "months";
  return `${years} ${yearNote} ${months} ${monthNote}`;
}

function getColorLabel(color) {
  const span = document.createElement("span");
  span.style.color = color;
  span.textContent = color;
  return span.outerHTML;
}

function deleteItem(id, config) {
  const apiUrl = `${config.apiUrl}/${id}`;
  fetch(apiUrl, { method: "DELETE" })
    .then((response) => {
      if (!response.ok) throw new Error("Помилка при видаленні");
      return response.json();
    })
    .then(() => DataTable(config))
    .catch((error) => console.error(error.message));
}

const config1 = {
  parent: "#usersTable",
  columns: [
    {
      title: "Ім’я",
      value: "name",
      input: { type: "text", name: "name", required: true },
    },
    {
      title: "Прізвище",
      value: "surname",
      input: { type: "text", name: "surname", required: true },
    },
    {
      title: "Вік",
      value: (user) => getAge(user.birthday),
      input: {
        type: "date",
        name: "birthday",
        label: "День народження",
        required: true,
      },
    },
    {
      title: "Фото",
      value: (user) =>
        `<img src="${
          user.avatar ||
          "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg"
        }" alt="${user.name} ${user.surname}" />`,
      input: { type: "url", name: "avatar", required: false },
    },
  ],
  apiUrl: "https://mock-api.shpp.me/Tetiana5Buria/users",
};

DataTable(config1);

const config2 = {
  parent: "#productsTable",
  columns: [
    {
      title: "Назва",
      value: "title",
      input: { type: "text" },
    },
    {
      title: "Ціна",
      value: (product) => `${product.price} ${product.currency}`,
      input: [
        { type: "number", name: "price", label: "Ціна" },
        {
          type: "select",
          name: "currency",
          label: "Валюта",
          options: ["$", "€", "₴"],
          required: false,
        },
      ],
    },
    {
      title: "Колір",
      value: (product) => getColorLabel(product.color),
      input: { type: "color", name: "color" },
    },
  ],
  apiUrl: "https://mock-api.shpp.me/Tetiana5Buria/products",
};

DataTable(config2);
