require('dotenv/config');
const token = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN;

fetch('https://api.themoviedb.org/3/search/tv?query=Chicago+PD&language=en-US', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(d => {
  d.results.slice(0, 5).forEach(s => console.log(s.id, s.name, s.first_air_date));
})
.catch(console.error);
