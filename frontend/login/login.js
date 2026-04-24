const API = "https://controle-de-livros-backend-1.onrender.com";

async function login() {

    const email = document.getElementById("email").value;
    const senha = document.getElementById("password").value;

    const resposta = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify ({
            email: email,
            senha: senha
        })
    });

    const dados = await resposta.json();

    console.log(dados);

    if(dados.token) {
        localStorage.setItem("token", dados.token);
        localStorage.setItem("usuario_id", dados.id);
        alert("Login realizado!");
        window.location.href = "../index.html";
    } else {
        alert("Erro no login");
    }
}

async function recoverPassword() {
    
    const email = document.getElementById("email").value;

    if (!email) {
        alert("Digite o email primeiro");
        return;
    }

    const resposta = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
        }
    );

    const dados = await resposta.json();

    alert(dados.mensagem);
}

function goToRegister() {
    window.location.href = "../register/register.html";
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
        form.recoverPassword().disabled = !emailValid;

        const passwordValid= isPasswordValid();
        form.loginButton().disabled = !emailValid || !passwordValid; 
    }

function toggleEmailErrors() {
        const email = form.email().value;
        form.emailRequiredError().style.display = email ? "none" : "block";

        form.emailInvalidError().style.display =validateEmail(email) ? "none" : "block";
    }

    function togglePassowordErrors() {
        const password = form.password().value;
        form.passwordRequiredError().style.display = password ? "none" : "block";
        if (password.length >=6) {
            form.passwordInvalidError().style.display = "none";
        } else {
            form.passwordInvalidError().style.display = "block";
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

const form = {
        email: () => document.getElementById("email"),
        emailInvalidError: () => document.getElementById("email-invalid-error"),
        emailRequiredError: () => document.getElementById("email-required-error"),
        password: () => document.getElementById("password"),
        passwordRequiredError: () => document.getElementById("password-required-error"),
        passwordInvalidError: () => document.getElementById("password-invalid-error"),
        loginButton: () => document.getElementById("login-button"),
        recoverPassword: () => document.getElementById("recover-password-button")
    }