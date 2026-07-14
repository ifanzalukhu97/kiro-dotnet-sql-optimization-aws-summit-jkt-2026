using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;

namespace WideWorldImporters.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public PaymentController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<PaymentListDto>>> GetPayments(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? customerId = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.CustomerTransactions
                .Include(ct => ct.Customer)
                .AsQueryable();

            if (customerId.HasValue)
            {
                query = query.Where(ct => ct.CustomerID == customerId.Value);
            }

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderByDescending(ct => ct.TransactionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(ct => new PaymentListDto
                {
                    CustomerTransactionId = ct.CustomerTransactionID,
                    CustomerName = ct.Customer.CustomerName,
                    TransactionDate = ct.TransactionDate,
                    TransactionAmount = ct.TransactionAmount,
                    OutstandingBalance = ct.OutstandingBalance
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<PaymentListDto>
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentDetailDto>> GetPayment(string id)
        {
            if (!int.TryParse(id, out var transactionId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var transaction = await _context.CustomerTransactions
                .Include(ct => ct.Customer)
                .FirstOrDefaultAsync(ct => ct.CustomerTransactionID == transactionId);

            if (transaction == null)
            {
                return NotFound(new { error = $"Resource 'Payment' with identifier '{transactionId}' was not found" });
            }

            var detail = new PaymentDetailDto
            {
                CustomerTransactionId = transaction.CustomerTransactionID,
                CustomerId = transaction.CustomerID,
                CustomerName = transaction.Customer?.CustomerName ?? string.Empty,
                TransactionDate = transaction.TransactionDate,
                AmountExcludingTax = transaction.AmountExcludingTax,
                TaxAmount = transaction.TaxAmount,
                TransactionAmount = transaction.TransactionAmount,
                OutstandingBalance = transaction.OutstandingBalance
            };

            return Ok(detail);
        }

        [HttpGet("lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetCustomersLookup()
        {
            var customers = await _context.Customers
                .OrderBy(c => c.CustomerName)
                .Take(1000)
                .Select(c => new LookupDto
                {
                    Id = c.CustomerID,
                    Name = c.CustomerName
                })
                .ToListAsync();

            return Ok(customers);
        }
    }
}
