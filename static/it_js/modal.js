export class Modal {
    constructor(title) {
        this.title = title;
        this.modalEl = document.createElement("div");
        this.modalEl.className = "modal";

        this.modalEl.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${this.title}</h3>
                    </div>
                    <div class="modal-body"></div>
                    <div class="form-buttons">
                        <button type="button" class="cancel-button button-format">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.body = this.modalEl.querySelector(".modal-body");
        this.buttons = this.modalEl.querySelector(".form-buttons");
        this.cancelButton = this.modalEl.querySelector(".cancel-button");

        this.cancelButton.addEventListener("click", () => this.close());
    }

    addButton(label, onClick, type="button") {
        const button = document.createElement("button");
        button.type = type;
        button.textContent = label;
        button.className = 'button-format';

        button.addEventListener('click', onClick);
        this.buttons.insertBefore(button, this.cancelButton);
        return button;
    }

    buildButtons(buttons) {
        buttons.forEach(button => {
            this.addButton(button.label, button.onClick, button.type);
        })
    }

    open() {
        document.body.append(this.modalEl)
        document.body.classList.add("modal-open")
    }

    close() {
        this.modalEl.remove()
        document.body.classList.remove("modal-open")
    }
}

export class InfoModal extends Modal {
    constructor(title, options = {}) {
        super(title);
        this.#buildModal(options.fields);
        this.buildButtons(options.buttons);
    }

    #field(label, key) {
        const infoList = document.createElement("div");
        infoList.className = "info-list";

        const infoLabel = document.createElement("div");
        infoLabel.className = "info-label";
        infoLabel.textContent = label;

        const infoValue = document.createElement("div");
        infoValue.className = "info-value";
        infoValue.dataset.key = key;
        infoValue.textContent = '-';

        infoList.append(infoLabel, infoValue);
        this.body.append(infoList);
    }

    #buildModal(fields) {
        fields.forEach(field => {
            console.log(field)
            this.#field(field.label, field.key);
        });
    }

    appendInfo(modalInfo) {
        console.log(modalInfo)
        const valueItems = this.body.querySelectorAll("[data-key]");
        for (const valueItem of valueItems) {
            const key = valueItem.dataset.key;
            valueItem.textContent = modalInfo[key] ?? '-';
        }
    }
}

export class FormModal extends Modal {
    constructor(title, formOptions = {}) {
        super(title);

        this.form = document.createElement('form');
        this.form.id = "new-device-form";
        this.body.before(this.form);
        this.form.append(this.body, this.buttons);

        this.#buildFields(formOptions.inputs)
        this.buildButtons(formOptions.buttons)
    }

    #field({label, name, type, required=false, options=[], placeholder=''}) {
        const inputSection = document.createElement('label');
        inputSection.textContent = label;

        let input;
        if (type === "select") {
            input = document.createElement("select");
            for (const option of options) {
                const optionItem = document.createElement('option');
                optionItem.value = option.value;
                optionItem.textContent = option.label;
                input.append(optionItem);
            }
        } else if (type === "textarea") {
            input = document.createElement("textarea")
        }
        else {
            input = document.createElement("input");
            input.type = type
        }
        input.name = name;
        input.required = required;

        inputSection.append(input)
        return inputSection
    }

    #buildFields(inputs) {
        inputs.forEach(input => {
            this.buttons.before(this.#field(input))
        })
    }
}