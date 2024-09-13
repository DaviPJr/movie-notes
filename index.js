import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "movies",
    password: "1234",
    port: 5432,
  });
  db.connect();

const apiKey = 'f3b3893b0900a73ece91dd262b5f6cf6'; 
// const movieTitles = ['Dune', 'Poor Things', 'Spirited Away', 'Challengers', 'Get Out'];

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM movies");

        const moviesData = result.rows.map(movie => ({
            id: movie.id,
            title: movie.title,
            posterUrl: movie.poster_url,
            description: movie.description,
            rating: movie.rating
        }));

        res.render("index.ejs", { moviesData });
    } catch (error) {
        console.error("Erro ao buscar os filmes:", error);
        res.render("index.ejs", { moviesData: [] });
    }
});

app.post("/edit/:id", async (req, res) => {
    const movieId = req.params.id;
    const {description, rating} = req.body;

    console.log("ID do filme:", movieId);
    console.log("Descrição recebida:", description); 
    console.log("Avaliação recebida:", rating); 

    try {
        const query = "UPDATE movies SET description = $1, rating = $2 WHERE id = $3";
        const values = [description, rating, movieId];

        await db.query(query, values);  

        console.log("Filme atualizado com sucesso");
        res.redirect("/");
    } catch (error) {
        console.error("Erro ao atualizar o filme", error);
        res.status(500).send("Erro ao atualizar o filme");
    }
})

app.get("/add-movie", (req, res) => {
    res.render("add-movie.ejs")
});

app.post("/add-movie", async (req, res) => {
    const {title, description, rating} = req.body;

    try{
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: apiKey,
                query: title
            }
        });

        const movie = response.data.results[0];
        if (movie) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

            const query = "INSERT INTO movies (title, poster_url, description, rating) VALUES ($1, $2, $3, $4) RETURNING *";
            const values = [title, posterUrl, description, rating];

            const result = await db.query(query, values);
            console.log("Filmes adicionados:", result.rows[0]);
            
            res.redirect("/");
        } else {
            res.status(404).send("Filme não encontrado")
        }
    } catch (error) {
        console.error("Erro ao adicionar o filme", error);
        res.status(500).send("Erro ao adicionar o filme");
    }
})

