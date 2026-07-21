using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;
using WideWorldImporters.Api.Models.Entities;

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
            [FromQuery] string customerId = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.CustomerTransactions
                .Include(ct => ct.Customer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(customerId))
            {
                var ids = customerId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(ct => ids.Contains(ct.CustomerID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(ct => ct.Customer.CustomerName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var data = await ApplySort(query, sortBy, sortDirection)
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

        private static IQueryable<CustomerTransaction> ApplySort(IQueryable<CustomerTransaction> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "customertransactionid" => desc ? query.OrderByDescending(ct => ct.CustomerTransactionID) : query.OrderBy(ct => ct.CustomerTransactionID),
                "transactiondate" => desc ? query.OrderByDescending(ct => ct.TransactionDate) : query.OrderBy(ct => ct.TransactionDate),
                "customername" => desc ? query.OrderByDescending(ct => ct.Customer.CustomerName) : query.OrderBy(ct => ct.Customer.CustomerName),
                "transactionamount" => desc ? query.OrderByDescending(ct => ct.TransactionAmount) : query.OrderBy(ct => ct.TransactionAmount),
                "outstandingbalance" => desc ? query.OrderByDescending(ct => ct.OutstandingBalance) : query.OrderBy(ct => ct.OutstandingBalance),
                _ => query.OrderByDescending(ct => ct.TransactionDate) // default sort
            };
        }
    }
}
