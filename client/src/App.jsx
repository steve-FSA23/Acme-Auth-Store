import { useState, useEffect } from "react";
import SignUpForm from "./components/SignUpForm";
import SignInForm from "./components/SignInForm";

function App() {
    const [auth, setAuth] = useState({});
    const [products, setProducts] = useState([]);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        attemptLoginWithToken();
    }, []);

    const attemptLoginWithToken = async () => {
        const token = window.localStorage.getItem("token");
        if (token) {
            const response = await fetch(`/api/auth/me`, {
                headers: {
                    authorization: token,
                },
            });
            const json = await response.json();
            if (response.ok) {
                setAuth(json);
            } else {
                window.localStorage.removeItem("token");
            }
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const response = await fetch("/api/products");
            const json = await response.json();
            setProducts(json);
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchFavorites = async () => {
            const response = await fetch(`/api/users/${auth.id}/favorites`, {
                headers: {
                    authorization: window.localStorage.getItem("token"),
                },
            });
            const json = await response.json();
            if (response.ok) {
                setFavorites(json);
            } else {
                console.log("json: ", json);
            }
        };
        if (auth.id) {
            fetchFavorites();
        } else {
            setFavorites([]);
        }
    }, [auth]);

    const handleLogin = async (credentials) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await response.json();
        if (response.ok) {
            window.localStorage.setItem("token", json.token);
            attemptLoginWithToken();
            alert("Login successful!");
        } else {
            console.log(json);
        }
    };

    const handleSignUp = async ({ username, password }) => {
        try {
            const response = await fetch("/api/users/signup", {
                method: "POST",
                body: JSON.stringify({ username, password }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                alert("Sign up successful!");
            } else {
                const errorMessage = await response.text();
                alert(`Sign up failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Sign up failed:", error);
        }
    };

    const addFavorite = async (product_id) => {
        const response = await fetch(`/api/users/${auth.id}/favorites`, {
            method: "POST",
            body: JSON.stringify({ product_id }),
            headers: {
                "Content-Type": "application/json",
                authorization: window.localStorage.getItem("token"),
            },
        });

        const json = await response.json();
        if (response.ok) {
            setFavorites([...favorites, json]);
        } else {
            console.log(json);
        }
    };

    const removeFavorite = async (id) => {
        const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
            method: "DELETE",
            headers: {
                authorization: window.localStorage.getItem("token"),
            },
        });
        if (response.ok) {
            setFavorites(favorites.filter((favorite) => favorite.id !== id));
        }
    };

    const logout = () => {
        window.localStorage.removeItem("token");
        setAuth({});
    };

    return (
        <div>
            {!auth.id ? (
                <div>
                    <h2>Sign In</h2>
                    <SignInForm login={handleLogin} />
                    <h2>Sign Up</h2>
                    <SignUpForm signUp={handleSignUp} />
                </div>
            ) : (
                <div>
                    <p>Welcome, {auth.username}!</p>
                    <button onClick={logout}>Logout</button>
                </div>
            )}

            <ul>
                {products.map((product) => {
                    const isFavorite = favorites.find(
                        (favorite) => favorite.product_id === product.id
                    );
                    return (
                        <li
                            key={product.id}
                            className={isFavorite ? "favorite" : ""}
                        >
                            {product.name}
                            {auth.id && isFavorite && (
                                <button
                                    onClick={() =>
                                        removeFavorite(isFavorite.id)
                                    }
                                >
                                    -
                                </button>
                            )}
                            {auth.id && !isFavorite && (
                                <button onClick={() => addFavorite(product.id)}>
                                    +
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default App;
