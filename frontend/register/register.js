const API = "https://controle-de-livros-backend.onrender.com";

async function register() {
    
    const email = form.email().value;
    const password = form.password().value;
    const confirmPassword = form.confirmPassword().value;

    const resposta = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });

        if (!resposta.ok) {
            const errorData = await resposta.json().catch(() => ({ erro: "Erro desconhecido no servidor" }));
            alert(errorData.erro || "Erro ao cadastrar");
            return;
        }

        const data = await resposta.json();

        console.log(data);

        localStorage.setItem("token", data.access_token);

        window.location.href = "../index.html";
    }

function onChangeEmail() {
        toggleButtonsDisable();
        toggleEmailErrors();
    }

function onChangePassword() {
        toggleButtonsDisable();
        togglePassowordErrors();
    }

function toggleButtonsDisable() {
        const emailValid = isEmailValid();
        const passwordValid= isPasswordValid();
        const confirmPassword = isConfirmPasswordValid();
        form.registerButton().disabled = !emailValid || !passwordValid || !confirmPassword; 
    }

function toggleEmailErrors() {
        const email = form.email().value;
        form.emailRequiredError().style.display = email ? "none" : "block";

        form.emailInvalidError().style.display =validateEmail(email) ? "none" : "block";
    }

    function togglePassowordErrors() {
        const password = form.password().value;
        const confirmPassword = form.confirmPassword().value;

        form.passwordRequiredError().style.display = password ? "none" : "block";
        if (password.length >=6) {
            form.passwordInvalidError().style.display = "none";
        } else {
            form.passwordInvalidError().style.display = "block";
        }
        if (confirmPassword) {
            form.passwordDoesntEquals().style.display = 
                password === confirmPassword ? "none" : "block";
        } else {
            form.passwordDoesntEquals().style.display = "none";
        }
    }

function isEmailValid() {
        const email = form.email().value;
        if (!email) {
            return false;
        }
        return validateEmail(email);
    }

function validateEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

function isPasswordValid() {
        const password = form.password().value;
        if (!password) {
            return false;
        }
        return true;
    }

function isConfirmPasswordValid() {
    const confirmPassword = form.confirmPassword().value;
        if (!confirmPassword) {
            return false;
        }
        return true;
    }

const form = {
        email: () => document.getElementById("email"),
        emailInvalidError: () => document.getElementById("email-invalid-error"),
        emailRequiredError: () => document.getElementById("email-required-error"),
        password: () => document.getElementById("password"),
        passwordRequiredError: () => document.getElementById("password-required-error"),
        passwordInvalidError: () => document.getElementById("password-invalid-error"),
        passwordDoesntEquals: () => document.getElementById("password-doesnt-equals"),
        registerButton: () => document.getElementById("register-button"),
        confirmPassword: () => document.getElementById("confirm-password")
    }