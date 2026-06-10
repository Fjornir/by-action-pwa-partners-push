// === ДАННЫЕ ДЛЯ ПУШЕЙ ===
const defaultDelays = [];
const defaultTitles = [];
const defaultBodies = [];

let pushType = "install"; // install, reg, dep
let imageBase64 = ""; // Хранение base64 изображения

const pushTypeMap = {
  install: { text: "инсталла", btn: "btn-install", unitXPath: "/html/body/ul/li[1]" },
  reg: { text: "регистрации", btn: "btn-reg", unitXPath: "/html/body/ul/li[2]" },
  dep: { text: "Первого депозита", btn: "btn-dep", unitXPath: "/html/body/ul/li[3]" },
};

function escapeString(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// === ФУНКЦИИ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ ===
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

async function uploadImage(base64Data, isFirstElement = false) {
  const uploadButton = document.querySelector('label.push__upload-image-button[for="push_image"]');
  if (!uploadButton) {
    console.warn('Кнопка загрузки изображения не найдена');
    return false;
  }
  
  const fileInput = document.getElementById('push_image');
  if (!fileInput) {
    console.warn('Input для загрузки изображения не найден');
    return false;
  }
  
  try {
    const blob = base64ToBlob(base64Data);
    const file = new File([blob], 'push-image.png', { type: blob.type });
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    const event = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(event);
    
    if (isFirstElement) {
      await waitForElement('.push__image-previews-wrap .push__image-preview', 5000);
      console.log('✅ Изображение загружено и превью появилось');
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error);
    return false;
  }
}

function getFormData() {
  const form = document.getElementById("pushForm");
  const delays = (form.delays.value || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const titles = (form.titles.value || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bodies = (form.bodies.value || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    delays: delays.length ? delays : defaultDelays,
    titles: titles.length ? titles : defaultTitles,
    bodies: bodies.length ? bodies : defaultBodies,
  };
}

function generateCode({ delays, titles, bodies }, pushType) {
  const pushTypeText = pushTypeMap[pushType].text;
  const pushTypeUnitXPath = pushTypeMap[pushType].unitXPath;
  const imageData = imageBase64 ? `const imageBase64 = "${imageBase64}";
` : '';
  return `// === ДАННЫЕ ДЛЯ ПУШЕЙ ===
const delays = [${delays.map((d) => `\"${escapeString(d)}\"`).join(", ")}];
const titles = [${titles.map((t) => `\"${escapeString(t)}\"`).join(", ")}];
const bodies = [${bodies.map((b) => `\"${escapeString(b)}\"`).join(", ")}];
const pushType = "${pushType}";
${imageData}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function selectDropdown(buttonXPath) {
    const button = getElementByXPath(buttonXPath);
    if (!button) return false;
    button.click();
    return true;
}

async function waitForWindowClose(xpath) {
    while (getElementByXPath(xpath)) {
        await wait(20);
    }
}

async function waitForModalClose() {
    if (!document.querySelector('.modal-content')) return;
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            if (!document.querySelector('.modal-content')) {
                observer.disconnect();
                resolve();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        setTimeout(() => {
            observer.disconnect();
            reject(new Error('Element ' + selector + ' not found within ' + timeout + 'ms'));
        }, timeout);
    });
}

async function uploadImage(base64Data, isFirstElement = false) {
    const uploadButton = document.querySelector('label.push__upload-image-button[for="push_image"]');
    if (!uploadButton) {
        console.warn('Кнопка загрузки изображения не найдена');
        return false;
    }
    
    const fileInput = document.getElementById('push_image');
    if (!fileInput) {
        console.warn('Input для загрузки изображения не найден');
        return false;
    }
    
    try {
        const blob = base64ToBlob(base64Data);
        const file = new File([blob], 'push-image.png', { type: blob.type });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
        
        if (isFirstElement) {
            await waitForElement('.push__image-previews-wrap .push__image-preview', 5000);
            console.log('✅ Изображение загружено и превью появилось');
        } else {
            await wait(800);
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        return false;
    }
}

// === ОСНОВНОЙ СКРИПТ ===
(async function fillPushes() {
    for (let i = 0; i < delays.length; i++) {
        // Ждать закрытия модального окна перед добавлением нового пуша
        await waitForModalClose();

        console.log("🟢 Заполнение пуша " + (i + 1));

        // Нажать \"Добавить пуш\"
        const addBtn = getElementByXPath("/html/body/main/section/div[2]/button");
        addBtn?.click();
        await wait(100);
        
        // Выбрать тип пуша
        await selectDropdown(
            "/html/body/div/div/div/div/form/div[1]/div[1]/div[1]/div[1]/div/button"
        );
        let typeXPath = "";
        if (pushType === "install") typeXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[1]/div[1]/div/ul/li[1]";
        else if (pushType === "reg") typeXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[1]/div[1]/div/ul/li[2]";
        else if (pushType === "dep") typeXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[1]/div[1]/div/ul/li[3]";
        if (typeXPath) {
            const typeElement = getElementByXPath(typeXPath);
            if (typeElement) {
                typeElement.click();
            } else {
                console.warn("Не найден элемент типа пуша по XPath: " + typeXPath);
            }
        }
        await wait(300);

        // Разобрать значение задержки
        const [value, unit] = delays[i].split(" ");
        const delayInput = getElementByXPath("/html/body/div/div/div/div/form/div[1]/div[1]/div[2]/div[1]/input");
        delayInput.value = value;
        delayInput.dispatchEvent(new Event("input", { bubbles: true }));

        // Открыть дропдаун и выбрать нужную единицу
        const dropdownClicked = await selectDropdown(
            "/html/body/div[2]/div/div/div/form/div[1]/div[1]/div[2]/div[2]/div"
        );
        let unitXPath = "";
        if (unit === "minutes") unitXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[2]/div[2]/div/ul/li[1]";
        else if (unit === "hours" || unit === "hour") unitXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[2]/div[2]/div/ul/li[2]";
        else if (unit === "days" || unit === "day") unitXPath = "/html/body/div/div/div/div/form/div[1]/div[1]/div[2]/div[2]/div/ul/li[3]";
        if (dropdownClicked && unitXPath) {
            const unitElement = getElementByXPath(unitXPath);
            if (unitElement) {
                unitElement.click();
            } else {
                console.warn("error");
            }
        }

        await wait(300);

        // Заголовок
        const titleField = getElementByXPath("/html/body/div/div/div/div/form/div[2]/div[1]/div[1]/textarea");
        titleField.value = titles[i];
        titleField.dispatchEvent(new Event("input", { bubbles: true }));

        // Тело
        const bodyField = getElementByXPath("/html/body/div/div/div/div/form/div[2]/div[1]/div[2]/textarea");
        bodyField.value = bodies[i];
        bodyField.dispatchEvent(new Event("input", { bubbles: true }));

        // Загрузить изображение, если оно есть
        if (typeof imageBase64 !== 'undefined' && imageBase64) {
            console.log("📸 Загрузка изображения...");
            await uploadImage(imageBase64, i === 0);
        }

        // Нажать \"Добавить пуш\" (в форме)
        const addPushButton = getElementByXPath("/html/body/div[2]/div/div/div/form/div[1]/div[3]/div/div/button");
        if (addPushButton) {
            addPushButton.click();
            await wait(500);
            console.log("✅ Пуш добавлен");
        } else {
            console.warn("⚠️ Не найдена кнопка 'Добавить пуш'");
        }

        // Ждать пока модальное окно уйдёт из DOM
        await waitForModalClose();
        await wait(300);
    }

    console.log("🎉 Все пуши заполнены и добавлены.");
})();`;
}

function updateCodeBlock() {
  const data = getFormData();
  const code = generateCode(data, pushType);
  document.getElementById("codeBlock").textContent = code;
}

function copyCode() {
  const code = document.getElementById("codeBlock").textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Скопировано!";
    setTimeout(() => {
      btn.textContent = "Скопировать";
    }, 1200);
    // Очищаем поля ввода
    const form = document.getElementById("pushForm");
    form.delays.value = "";
    form.titles.value = "";
    form.bodies.value = "";
    updateCodeBlock();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Заполнить дефолтные значения
  const form = document.getElementById("pushForm");
  form.delays.value = defaultDelays.join("\n");
  form.titles.value = defaultTitles.join("\n");
  form.bodies.value = defaultBodies.join("\n");
  updateCodeBlock();
  form.addEventListener("input", updateCodeBlock);
  document.getElementById("copyBtn").addEventListener("click", copyCode);

  // Добавить обработчики для кнопок выбора типа пуша
  function setPushType(type) {
    pushType = type;
    // Визуально выделить выбранную кнопку
    Object.keys(pushTypeMap).forEach((key) => {
      const btn = document.getElementById(pushTypeMap[key].btn);
      if (btn) {
        if (key === type) {
          btn.classList.add("ring-4", "ring-offset-2", "ring-blue-300", "scale-105");
        } else {
          btn.classList.remove("ring-4", "ring-offset-2", "ring-blue-300", "scale-105");
        }
      }
    });
    updateCodeBlock();
  }
  document.getElementById("btn-install").addEventListener("click", () => setPushType("install"));
  document.getElementById("btn-reg").addEventListener("click", () => setPushType("reg"));
  document.getElementById("btn-dep").addEventListener("click", () => setPushType("dep"));
  // Выделить по умолчанию первую кнопку
  setPushType("install");

  // === ОБРАБОТЧИКИ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ===
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const imageStatus = document.getElementById("imageStatus");
  const fileName = document.getElementById("fileName");
  const removeImageBtn = document.getElementById("removeImageBtn");

  // Обработчик выбора файла
  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера файла (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Размер файла превышает 5MB. Пожалуйста, выберите файл меньшего размера.");
      imageInput.value = "";
      return;
    }

    try {
      // Конвертировать в base64
      const base64 = await convertImageToBase64(file);
      imageBase64 = base64;

      // Показать превью
      imagePreview.src = base64;
      imagePreviewContainer.classList.remove("hidden");

      // Показать статус
      fileName.textContent = file.name;
      imageStatus.classList.remove("hidden");

      // Показать кнопку удаления
      removeImageBtn.classList.remove("hidden");

      // Обновить код
      updateCodeBlock();
    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error);
      alert("Ошибка при загрузке изображения. Попробуйте другой файл.");
    }
  });

  // Обработчик удаления изображения
  removeImageBtn.addEventListener("click", () => {
    imageBase64 = "";
    imageInput.value = "";
    imagePreview.src = "";
    imagePreviewContainer.classList.add("hidden");
    imageStatus.classList.add("hidden");
    removeImageBtn.classList.add("hidden");
    updateCodeBlock();
  });
});
