export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
      // In a real implementation, this would send an email
      // For now, we'll just return a success response
  
      console.log(`Sending email for invoice ${params.id}`)
  
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      // Return HTML response that will redirect back to the invoice page
      return new Response(
        `
        <html>
          <head>
            <title>Email Sent</title>
            <meta http-equiv="refresh" content="2;url=/admin/billing/invoices/${params.id}" />
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f9fafb;
                color: #111827;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                max-width: 90%;
                width: 24rem;
              }
              .success {
                color: #10b981;
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              h1 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
              }
              p {
                color: #6b7280;
                margin-bottom: 1.5rem;
              }
              .redirect {
                font-size: 0.875rem;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✓</div>
              <h1>Email Sent Successfully</h1>
              <p>The invoice has been emailed to the customer.</p>
              <div class="redirect">Redirecting back to invoice page...</div>
            </div>
          </body>
        </html>
      `,
        {
          headers: {
            "Content-Type": "text/html",
          },
        },
      )
    } catch (error) {
      console.error("Error sending email:", error)
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <meta http-equiv="refresh" content="3;url=/admin/billing/invoices/${params.id}" />
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f9fafb;
                color: #111827;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                max-width: 90%;
                width: 24rem;
              }
              .error {
                color: #ef4444;
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              h1 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
              }
              p {
                color: #6b7280;
                margin-bottom: 1.5rem;
              }
              .redirect {
                font-size: 0.875rem;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">✗</div>
              <h1>Error Sending Email</h1>
              <p>There was a problem sending the email. Please try again later.</p>
              <div class="redirect">Redirecting back to invoice page...</div>
            </div>
          </body>
        </html>
      `,
        {
          headers: {
            "Content-Type": "text/html",
          },
          status: 500,
        },
      )
    }
  }
  
  