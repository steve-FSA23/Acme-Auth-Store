import { useState } from "react";

const SignInForm = ({ login }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = (ev) => {
        ev.preventDefault();
        login({ username, password });
    };
    return (
        <form onSubmit={submit}>
            <input
                value={username}
                placeholder="username"
                onChange={(ev) => setUsername(ev.target.value)}
            />
            <input
                value={password}
                placeholder="password"
                onChange={(ev) => setPassword(ev.target.value)}
            />
            <button disabled={!username || !password}>Login</button>
        </form>
    );
};

export default SignInForm;
