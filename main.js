// === ДАННЫЕ ДЛЯ ПУШЕЙ ===
const defaultDelays = [];
const defaultTitles = [];
const defaultBodies = [];

let pushType = "install"; // install, reg, dep

const pushTypeMap = {
  install: { text: "инсталла", btn: "btn-install", unitXPath: "/html/body/ul/li[1]" },
  reg: { text: "регистрации", btn: "btn-reg", unitXPath: "/html/body/ul/li[2]" },
  dep: { text: "Первого депозита", btn: "btn-dep", unitXPath: "/html/body/ul/li[3]" },
};

function escapeString(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
  return `// === ДАННЫЕ ДЛЯ ПУШЕЙ ===
const delays = [${delays.map((d) => `\"${escapeString(d)}\"`).join(", ")}];
const titles = [${titles.map((t) => `\"${escapeString(t)}\"`).join(", ")}];
const bodies = [${bodies.map((b) => `\"${escapeString(b)}\"`).join(", ")}];
const pushType = "${pushType}";

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

// === ОСНОВНОЙ СКРИПТ ===
(async function fillPushes() {
    for (let i = 0; i < delays.length; i++) {
        // Ждать закрытия окна перед добавлением нового пуша
        await waitForWindowClose("/html/body/main/section/div[4]/div/div");

        console.log("🟢 Заполнение пуша " + (i + 1));

        // Нажать \"Добавить пуш\"
        const addBtn = getElementByXPath("/html/body/main/section/div[2]/button");
        addBtn?.click();
        await wait(100);
        
        // Выбрать тип пуша
        await selectDropdown(
            "/html/body/main/section/div[4]/div/div/div/div/form/div[1]/div[1]/div[1]/div[1]/div/button"
        );
        let typeXPath = "";
        if (pushType === "install") typeXPath = "/html/body/ul/li[1]";
        else if (pushType === "reg") typeXPath = "/html/body/ul/li[2]";
        else if (pushType === "dep") typeXPath = "/html/body/ul/li[3]";
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
        const delayInput = getElementByXPath("/html/body/main/section/div[4]/div/div/div/div/form/div[1]/div[1]/div[2]/div[1]/input");
        delayInput.value = value;
        delayInput.dispatchEvent(new Event("input", { bubbles: true }));

        // Открыть дропдаун и выбрать нужную единицу
        const dropdownClicked = await selectDropdown(
            "/html/body/main/section/div[4]/div/div/div/div/form/div[1]/div[1]/div[2]/div[2]/div/button"
        );
        let unitXPath = "";
        if (unit === "minutes") unitXPath = "/html/body/ul/li[1]";
        else if (unit === "hours") unitXPath = "/html/body/ul/li[2]";
        else if (unit === "days" || unit === "day") unitXPath = "/html/body/ul/li[3]";
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
        const titleField = getElementByXPath("/html/body/main/section/div[4]/div/div/div/div/form/div[2]/div[1]/div[1]/textarea");
        titleField.value = titles[i];
        titleField.dispatchEvent(new Event("input", { bubbles: true }));

        // Тело
        const bodyField = getElementByXPath("/html/body/main/section/div[4]/div/div/div/div/form/div[2]/div[1]/div[2]/textarea");
        bodyField.value = bodies[i];
        bodyField.dispatchEvent(new Event("input", { bubbles: true }));

        // Нажать \"Добавить пуш\" (в форме)
        const addPushButton = getElementByXPath("/html/body/main/section/div[4]/div/div/div/div/form/div[1]/div[3]/div/button");
        if (addPushButton) {
            addPushButton.click();
            await wait(500);
            console.log("✅ Пуш добавлен");
        } else {
            console.warn("⚠️ Не найдена кнопка 'Добавить пуш'");
        }

        // Ждать закрытия окна после добавления пуша
        await waitForWindowClose("/html/body/main/section/div[4]/div/div");
        await wait(100);

        await wait(1000); // Пауза перед следующим пушем
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
});
