/**
 * CORS Logger Middleware
 * Logs CORS requests and blocked origins for debugging
 */

const corsLogger = (req, res, next) => {
  const origin = req.get('Origin');
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent');
  
  // Log CORS requests
  if (origin) {
    console.log(`🌐 CORS Request: ${method} ${url} from origin: ${origin}`);
    console.log(`   User-Agent: ${userAgent}`);
    console.log(`   IP: ${req.ip}`);
  } else {
    console.log(`🌐 CORS Request: ${method} ${url} (no origin)`);
  }
  
  // Continue to next middleware
  next();
};

export default corsLogger;
