using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;

namespace WideWorldImporters.Api.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public HealthController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                return Ok(new { status = "healthy" });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { status = "unhealthy", error = ex.Message });
            }
        }
    }
}
