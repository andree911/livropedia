const params = new URLSearchParams(window.location.search);
const token = params.get("token");

console.log("Token recebido:", token);

async function resetarSenha() {

    const novaSenha = document.getElementById("newPassword").value;

    const resposta = await fetch(
        "https://controle-de-livros.onrender.com/reset-password",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                senha: novaSenha
            })
        }
    );

    const dados = await resposta.json();

    alert(dados.mensagem);
}

function onChangeNewPassword() {
        toggleButtonsDisable();
        togglePassowordErrors();
    }

function toggleButtonsDisable() {
        const newPassword= isNewPasswordValid();
        const confirmNewPassword = isConfirmNewPasswordValid();
        form.resetPasswordButton().disabled = !newPassword || !confirmNewPassword; 
    }

    function togglePassowordErrors() {
        const newPassword = form.newPassword().value;
        const confirmNewPassword = form.confirmNewPassword().value;

        form.passwordRequiredError().style.display = newPassword ? "none" : "block";
        if (newPassword.length >=6) {
            form.passwordInvalidError().style.display = "none";
        } else {
            form.passwordInvalidError().style.display = "block";
        }
        if (confirmNewPassword) {
            form.passwordDoesntEquals().style.display = 
                newPassword === confirmNewPassword ? "none" : "block";
        } else {
            form.passwordDoesntEquals().style.display = "none";
        }
    }

function isNewPasswordValid() {
        const newPassword = form.newPassword().value;
        if (!newPassword) {
            return false;
        }
        return true;
    }

function isConfirmNewPasswordValid() {
    const confirmNewPassword = form.confirmNewPassword().value;
        if (!confirmNewPassword) {
            return false;
        }
        return true;
    }

const form = {
        newPassword: () => document.getElementById("new-password"),
        passwordRequiredError: () => document.getElementById("password-required-error"),
        passwordInvalidError: () => document.getElementById("password-invalid-error"),
        passwordDoesntEquals: () => document.getElementById("password-doesnt-equals"),
        confirmNewPassword: () => document.getElementById("confirm-new-password"),
        resetPasswordButton: () => document.getElementById("reset-password-button")
    }