import express, { Request, Response } from 'express';
import http, { IncomingMessage } from 'http';

const app = express();
const port = process.env.PORT || 8080;
const metadataServerHost = 'metadata.google.internal';
const regionPath = '/computeMetadata/v1/instance/region';

const getRegion = (): Promise<string> => {
  return new Promise((resolve) => {
    const options = {
      hostname: metadataServerHost,
      path: regionPath,
      method: 'GET',
      headers: {
        'Metadata-Flavor': 'Google',
      },
      timeout: 500
    };

    const req = http.request(options, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: Buffer | string) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parts = data.split('/');
          resolve(parts[parts.length - 1]);
        } else {
          console.error(`Metadata server returned status: ${res.statusCode}, data: ${data}`);
          resolve('unknown (metadata server error)');
        }
      });
    });

    req.on('error', (error: Error) => {
      console.error('Error fetching metadata:', error.message);
      resolve('unknown (metadata server unavailable)');
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Metadata request timed out');
      resolve('unknown (metadata timeout)');
    });

    req.end();
  });
};

app.get('/', async (req: Request, res: Response) => {
  const color = process.env.COLOR || '#3B82F6';
  const region = await getRegion();

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ef 100%);
      padding: 20px;
    }
    
    .container {
      max-width: 500px;
      width: 100%;
      text-align: center;
      padding: 2.5rem;
      border-radius: 16px;
      background-color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .container:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    }
    
    h1 {
      font-weight: 700;
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: #1F2937;
      letter-spacing: -0.025em;
    }
    
    p {
      color: #4B5563;
      margin-bottom: 1rem;
      font-size: 1.125rem;
    }
    
    .badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #F3F4F6;
      color: #374151;
      border-radius: 9999px;
      font-weight: 500;
      margin: 0.5rem 0 1.5rem;
      border: 1px solid #E5E7EB;
    }
    
    .color-box {
      width: 120px;
      height: 120px;
      margin: 1.5rem auto;
      border-radius: 12px;
      background-color: ${color};
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transform: perspective(800px) rotateY(10deg);
      transition: transform 0.5s ease;
      position: relative;
      overflow: hidden;
    }
    
    .color-box::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        rgba(255, 255, 255, 0.2),
        rgba(255, 255, 255, 0)
      );
      transform: rotate(30deg);
      pointer-events: none;
    }
    
    .color-box:hover {
      transform: perspective(800px) rotateY(-10deg);
    }
    
    .color-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: ${color};
      background-color: #F9FAFB;
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
      border: 1px solid #E5E7EB;
    }
    
    .footer {
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #6B7280;
    }
    
    @media (max-width: 640px) {
      .container {
        padding: 1.5rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
    }
  `;

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Colorteller</title>
      <style>${style}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    </head>
    <body>
      <div class="container">
        <h1>Colorteller</h1>
        <p>Running on Cloud Run in:</p>
        <div class="badge"><i class="fas fa-map-marker-alt"></i> ${region}</div>
  `;

  if (color) {
    html += `
        <p>The configured color is:</p>
        <div class="color-box"></div>
        <div class="color-name">${color}</div>
    `;
  } else {
    html += '<p>No COLOR environment variable set.</p>';
  }

  html += `
        <div class="footer">
          Powered by Statsig & Google Cloud Run
        </div>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const colorBox = document.querySelector('.color-box');
          if (colorBox) {
            colorBox.addEventListener('mousemove', (e) => {
              const box = e.currentTarget;
              const boxRect = box.getBoundingClientRect();
              const xPos = (e.clientX - boxRect.left) / boxRect.width - 0.5;
              const yPos = (e.clientY - boxRect.top) / boxRect.height - 0.5;
              box.style.transform = \`perspective(800px) rotateY(\${xPos * 20}deg) rotateX(\${-yPos * 20}deg)\`;
            });
            
            colorBox.addEventListener('mouseleave', () => {
              colorBox.style.transform = 'perspective(800px) rotateY(10deg)';
            });
          }
        });
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(port, () => {
  console.log(`colorteller listening on port ${port}`);
}); 
