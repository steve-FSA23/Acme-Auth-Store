const {
    client,
    createTables,
    createUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    destroyFavorite,
    authenticate,
    findUserWithToken,
} = require("./db");
const express = require("express");
const app = express();
app.use(express.json());

//for deployment only
const path = require("path");
app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
    "/assets",
    express.static(path.join(__dirname, "../client/dist/assets"))
);

// isLoggedIn middleware
const isLoggedIn = async (req, res, next) => {
    try {
        req.user = await findUserWithToken(req.headers.authorization);
        next();
    } catch (ex) {
        next(ex);
    }
};

app.post("/api/users/signup", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res
                .status(400)
                .send({ error: "Username and password are required" });
        }

        const newUser = await createUser({
            username,
            password,
        });

        res.status(201).send({ id: newUser.id, username: newUser.username });
    } catch (error) {
        next(error);
    }
});

app.post("/api/auth/login", async (req, res, next) => {
    try {
        res.send(await authenticate(req.body));
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/auth/me", isLoggedIn, async (req, res, next) => {
    try {
        res.send(req.user);
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/users", async (req, res, next) => {
    try {
        res.send(await fetchUsers());
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/users/:id/favorites", isLoggedIn, async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id) {
            const error = Error("not authorized");
            error.status = 401;
            throw error;
        }
        res.send(await fetchFavorites(req.params.id));
    } catch (ex) {
        next(ex);
    }
});

app.post("/api/users/:id/favorites", isLoggedIn, async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id) {
            const error = Error("not authorized");
            error.status = 401;
            throw error;
        }
        res.status(201).send(
            await createFavorite({
                user_id: req.params.id,
                product_id: req.body.product_id,
            })
        );
    } catch (ex) {
        next(ex);
    }
});

app.delete(
    "/api/users/:user_id/favorites/:id",
    isLoggedIn,
    async (req, res, next) => {
        try {
            if (req.params.user_id !== req.user.id) {
                const error = Error("not authorized");
                error.status = 401;
                throw error;
            }
            await destroyFavorite({
                user_id: req.params.user_id,
                id: req.params.id,
            });
            res.sendStatus(204);
        } catch (ex) {
            next(ex);
        }
    }
);

app.post("/api/products/create", async (req, res, next) => {
    try {
        const { name } = req.body;

        // Validate input data
        if (!name) {
            return res
                .status(400)
                .json({ error: "A product naame is a required fields" });
        }
        const newProduct = await createProduct({ name });
        res.status(201).json(newProduct);
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/products", async (req, res, next) => {
    try {
        res.send(await fetchProducts());
    } catch (ex) {
        next(ex);
    }
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({
        error: err.message ? err.message : err,
    });
});

const init = async () => {
    const port = process.env.PORT || 3000;
    await client.connect();
    console.log("connected to database");

    // await createTables();
    // console.log("tables created");

    // const [moe, lucy, ethyl, curly, foo, bar, bazz, quq, fip] =
    //     await Promise.all([
    //         createUser({ username: "moe", password: "m_pw" }),
    //         createUser({ username: "lucy", password: "l_pw" }),
    //         createUser({ username: "ethyl", password: "e_pw" }),
    //         createUser({ username: "curly", password: "c_pw" }),
    //         createProduct({ name: "foo" }),
    //         createProduct({ name: "bar" }),
    //         createProduct({ name: "bazz" }),
    //         createProduct({ name: "quq" }),
    //         createProduct({ name: "fip" }),
    //     ]);

    // console.log(await fetchUsers());
    // console.log(await fetchProducts());

    // console.log(await fetchFavorites(moe.id));
    // const favorite = await createFavorite({
    //     user_id: moe.id,
    //     product_id: foo.id,
    // });
    // console.log(favorite);
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
