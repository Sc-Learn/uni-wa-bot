import axios from 'axios';

const getQuote = async () => {
  try {
    const response = await fetch('http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en');
    const data = await response.json();
    if (data.quoteText) {
      return `"${data.quoteText}"\n\n~ *${data.quoteAuthor || 'Unknown'}*`;
    }
    return '📭 *Maaf, tidak ada kutipan yang ditemukan.*';
  } catch (error) {
    console.error('Gagal mengambil kutipan:', error);
    return '❌ *Maaf, gagal mengambil kutipan. Silakan coba lagi nanti.*';
  }
};

async function getMeme() {
  try {
    const response = await axios.get('https://meme-api.com/gimme');
    return {
      title: response.data.title,
      url: response.data.url,
    };
  } catch (error) {
    console.error('Error fetching meme:', error);
    return null;
  }
}

export { getQuote, getMeme };
