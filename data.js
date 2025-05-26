function DataTable(config) {
  const parentElement = document.querySelector(config.parent);
  parentElement.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("data-table");

  const thead = createHeader(config);
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  parentElement.append(table);
  addButtonAboveTable(config, table);

  fetchData(config.apiUrl)
    .then((data) => fillTableBody(tbody, config, data))
    .catch((error) => console.error("Error:", error.message));
}

async function fetchData(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to load data");
    }

    const { data } = await response.json();
    if (Array.isArray(data)) {
      const result = [];
      for (let i = 0; i < data.length; i++) {
        result.push({ id: data[i].id || String(i + 1), ...data[i] });
      }
      return result;
    } else {
      const entries = Object.entries(data);
      const result = [];
      for (let i = 0; i < entries.length; i++) {
        const [id, item] = entries[i];
        result.push({ id, ...item });
      }
      return result;
    }
  } catch (error) {
    console.error("Fetch error:", error.message);
    throw error;
  }
}

function createHeader(config) {
  const thead = document.createElement("thead");
  const row = document.createElement("tr");

  appendCell(row, "th", "№");
  for (let i = 0; i < config.columns.length; i++) {
    appendCell(row, "th", config.columns[i].title);
  }
  appendCell(row, "th", "Дії");

  thead.append(row);
  return thead;
}

function appendCell(row, tag, content, isHTML) {
  const cell = document.createElement(tag);
  if (isHTML) {
    cell.innerHTML = content;
  } else {
    cell.textContent = content;
  }
  row.append(cell);
}

function fillTableBody(tbody, config, data) {
  tbody.innerHTML = "";
  for (let i = 0; i < data.length; i++) {
    const row = document.createElement("tr");
    appendCell(row, "td", i + 1);

    for (let j = 0; j < config.columns.length; j++) {
      const col = config.columns[j];
      let value;
      if (typeof col.value === "function") {
        value = col.value(data[i]);
      } else {
        value = data[i][col.value] || "";
      }
      appendCell(row, "td", value, typeof col.value === "function");
    }

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Видалити";
    deleteButton.classList.add("remove__button");
    deleteButton.onclick = () => {
      if (data[i].id) {
        deleteItem(data[i].id, config);
      } else {
        console.error("No ID for item:", data[i]);
      }
    };

    actionCell.append(deleteButton);
    row.append(actionCell);
    tbody.append(row);
  }
}
function deleteItem(id, config) {
  fetch(`${config.apiUrl}/${id}`, { method: "DELETE" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error during deletion");
      }
      return response.json();
    })
    .then(() => DataTable(config))
    .catch((error) => console.error("Delete error:", error.message));
}

function addButtonAboveTable(config, table) {
  const parentElement = document.querySelector(config.parent);
  const addButton = document.createElement("button");
  addButton.textContent = "Додати";
  addButton.classList.add("add-button");
  addButton.onclick = () => showAddModal(config);

  parentElement.insertBefore(addButton, table);
}

function showAddModal(config) {
  const modal = createModal();
  const modalContent = createModalContent(modal);
  const form = createForm(config);

  modalContent.append(form);
  document.body.append(modal);

  handleModalClose(modal, form);
  handleFormSubmit(form, modal, config);
}

function createModal() {
  const modal = document.createElement("div");
  modal.classList.add("modalWindow");
  return modal;
}

function createModalContent(modal) {
  const content = document.createElement("div");
  content.classList.add("modal-content");
  modal.append(content);
  return content;
}

function createForm(config) {
  const form = document.createElement("form");
  /*  form.style.position = "relative"; // Додаємо відносне позиціонування для форми */

  const closeButton = createCloseButton(); //close button
  form.append(closeButton);

  for (let i = 0; i < config.columns.length; i++) {
    const inputGroups = createInputGroups(config.columns[i]);
    for (let j = 0; j < inputGroups.length; j++) {
      form.append(inputGroups[j]);
    }
  }

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("form-buttons");
  buttonContainer.append(createSubmitButton());
  form.append(buttonContainer);

  return form;
}
function createInputGroups(column) {
  const inputs = Array.isArray(column.input) ? column.input : [column.input];
  const inputGroups = [];
  for (let i = 0; i < inputs.length; i++) {
    const inputConfig = inputs[i];
    const inputGroup = document.createElement("div");
    inputGroup.classList.add("input-group");

    const label = document.createElement("label");
    label.textContent = inputConfig.label || column.title;

    const input = createInputElement(inputConfig, column);

    input.addEventListener("input", () => {
      validateForm(input.form);
    });

    inputGroup.append(label, input);
    inputGroups.push(inputGroup);
  }
  return inputGroups;
}
function createInputElement(inputConfig, column) {
  let input;
  if (inputConfig.type === "select" && inputConfig.options) {
    input = document.createElement("select");
    for (let i = 0; i < inputConfig.options.length; i++) {
      const option = document.createElement("option");
      option.value = inputConfig.options[i];
      option.textContent = inputConfig.options[i];
      input.append(option);
    }
  } else {
    input = document.createElement("input");
    if (inputConfig.type) {
      input.type = inputConfig.type;
    } else {
      input.type = "text";
    }
  }

  if (inputConfig.name) {
    input.name = inputConfig.name;
  } else {
    input.name = column.value;
  }
  if (inputConfig.required !== false) {
    input.required = true;
  } else {
    input.required = false;
  }

  const keys = Object.keys(inputConfig);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== "options" && key !== "label") {
      input[key] = inputConfig[key];
    }
  }

  return input;
}

function addEnterKeyListener(input, form) {
  // use enter
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });
}

function createSubmitButton() {
  //add button
  const button = document.createElement("button");
  button.classList.add("add_button");
  button.type = "submit";
  button.textContent = "Додати";
  return button;
}

function createCloseButton() {
  //close button
  const button = document.createElement("button");
  button.classList.add("close_button");
  button.type = "button";
  button.textContent = "X";
  return button;
}

function handleModalClose(modal, form) {
  const closeModal = () => document.body.removeChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const closeButton = form.querySelector("button[type='button']");
  closeButton.addEventListener("click", closeModal);

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    },
    { once: true }
  );
}

function handleFormSubmit(form, modal, config) {
  const submitButton = form.querySelector('button[type="submit"]');
  const inputs = form.querySelectorAll("input, select");

  const updateFormState = () => {
    const { isValid } = validateForm(form);
    submitButton.disabled = !isValid;
    inputs.forEach((input) => {
      input.classList.toggle(
        "input-error",
        input.required && !input.value.trim()
      );
    });
  };

  updateFormState();
  inputs.forEach((input) => {
    input.addEventListener("input", updateFormState);
    addEnterKeyListener(input, form); // Enter click

  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateFormState();
    const { newItem, isValid } = validateForm(form);

    if (!isValid) {
      alert("Дані не валідні");
      return;
    }

    try {
      await createNewElement(config.apiUrl, newItem);
      alert("Дані додано");
      document.body.removeChild(modal);
      DataTable(config);
    } catch (error) {
      alert("Помилка при додаванні: " + error.message);
    }
  });
}

function validateForm(form) {
  const newItem = {};
  let isValid = true;

  form.querySelectorAll("input, select").forEach((input) => {
    const value = input.value.trim();
    if (input.required && !value) {
      isValid = false;
    } else {
      newItem[input.name] = value;
    }
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

  let yearNote;
  if (years % 10 === 1 && years % 100 !== 11) {
    yearNote = "year";
  } else {
    yearNote = "years";
  }
  let monthNote;
  if (months % 10 === 1 && months % 100 !== 11) {
    monthNote = "month";
  } else {
    monthNote = "months";
  }
  return `${years} ${yearNote} ${months} ${monthNote}`;
}

function getColorLabel(color) {
  const span = document.createElement("span");
  span.className = "color-label";
  span.style.backgroundColor = color;
  span.title = color;
  return span.outerHTML;
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
           user.avatar /*||  "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg" */

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