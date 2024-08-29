import React, { useState } from 'react';
import axios from 'axios';

interface SearchResult {
  name: string;
  category: string;
  followers: string;
  description: string;
  recent_activity: string;
  action: string;
}

interface SearchResponse {
  excelBuffer: string;
  data: string;
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const downloadExcel = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post<SearchResponse>('https://insta-task.onrender.com/search', { searchQuery });

      // Extract the Excel base64 and JSON data from the response
      const { excelBuffer, data } = response.data;

      // Decode the Base64 string to a binary format
      const binaryString = window.atob(excelBuffer);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryString.length; i++) {
        view[i] = binaryString.charCodeAt(i);
      }

      // Create a Blob from the array buffer
      const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a link element, use it to download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'search_results.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Optionally, parse the JSON data and do something with it
      const jsonData: SearchResult[] = JSON.parse(data);
      console.log('Received data:', jsonData);
    } catch (error) {
      console.error('Error downloading the Excel file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Search and Download Excel</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter search term"
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />
        <button
          onClick={downloadExcel}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
        >
          Download Excel
        </button>
        {loading && (
          <div className="mt-4 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
