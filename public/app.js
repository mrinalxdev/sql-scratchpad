// public/app.js
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000;

const roomId = new URLSearchParams(location.search).get('room') || 'default';
const output = document.getElementById('output');
const textarea = document.getElementById('sql');
const runBtn = document.getElementById('run');
const status = document.getElementById('status');

function updateStatus(text, className) {
  status.textContent = text;
  status.className = className;
}

function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}?room=${roomId}`);
  
  updateStatus('Connecting...', 'connecting');

  ws.onopen = () => {
    updateStatus('Connected', 'connected');
    reconnectAttempts = 0;
  };

  ws.onclose = () => {
    updateStatus('Disconnected', 'disconnected');
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      updateStatus(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`, 'connecting');
      setTimeout(connect, reconnectDelay * reconnectAttempts);
    }
  };

  ws.onerror = () => {
    updateStatus('Connection Error', 'disconnected');
  };

  ws.onmessage = (e) => {
    const res = JSON.parse(e.data);
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result';
    
    if (res.error) {
      resultDiv.innerHTML = `
        <div class="query error">Error: ${res.error}</div>
        <pre>${JSON.stringify(res, null, 2)}</pre>
      `;
    } else {
      let tableHtml = '';
      if (res.columns && res.rows && res.columns.length > 0) {
        tableHtml = '<table>';
        tableHtml += '<thead><tr>';
        res.columns.forEach(col => {
          tableHtml += `<th>${col}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        res.rows.forEach(row => {
          tableHtml += '<tr>';
          row.forEach(cell => {
            tableHtml += `<td>${cell === null ? 'NULL' : cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
      }
      
      resultDiv.innerHTML = `
        <div class="query">Query ID: ${res.id ? res.id.substring(0,8) + '...' : 'N/A'}</div>
        <div>Rows: ${res.rowCount || 0} (${res.elapsedMs || 0}ms)</div>
        ${tableHtml}
        <details>
          <summary>Raw Response</summary>
          <pre>${JSON.stringify(res, null, 2)}</pre>
        </details>
      `;
    }
    
    output.appendChild(resultDiv);
    output.scrollTop = output.scrollHeight;
  };
}

function runQuery() {
  const sql = textarea.value.trim();
  if (!sql) return;
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    const id = crypto.randomUUID();
    ws.send(JSON.stringify({ id, sql }));
    
    const queryDiv = document.createElement('div');
    queryDiv.className = 'query';
    queryDiv.textContent = `> ${sql}`;
    output.appendChild(queryDiv);
    output.scrollTop = output.scrollHeight;
  } else {
    alert('Not connected to server.');
  }
}

runBtn.onclick = runQuery;
textarea.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    runQuery();
  }
});

connect();