using System;
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
    public class CustomersController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public CustomersController(WideWorldImportersContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/customers?page=1&pageSize=20
        /// Returns paginated customers with N+1 loading of summary fields.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<CustomerListDto>>> GetCustomers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var totalCount = await _context.Customers.CountAsync();

            var customers = await _context.Customers
                .OrderBy(c => c.CustomerName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var customerDtos = new List<CustomerListDto>();

            // N+1 pattern: for EACH customer, make SEPARATE queries
            foreach (var customer in customers)
            {
                // Separate query for order count
                var orderCount = await _context.Orders
                    .Where(o => o.CustomerID == customer.CustomerID)
                    .CountAsync();

                // Separate query for last order date
                var lastOrderDate = await _context.Orders
                    .Where(o => o.CustomerID == customer.CustomerID)
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => (DateTime?)o.OrderDate)
                    .FirstOrDefaultAsync();

                // Separate query for outstanding balance (sum of outstanding balances from transactions)
                var outstandingBalance = await _context.CustomerTransactions
                    .Where(ct => ct.CustomerID == customer.CustomerID)
                    .SumAsync(ct => ct.OutstandingBalance);

                customerDtos.Add(new CustomerListDto
                {
                    CustomerId = customer.CustomerID,
                    CustomerName = customer.CustomerName,
                    OrderCount = orderCount,
                    LastOrderDate = lastOrderDate,
                    OutstandingBalance = outstandingBalance,
                    CreditLimit = customer.CreditLimit
                });
            }

            return Ok(new PaginatedResponse<CustomerListDto>
            {
                Data = customerDtos,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        /// <summary>
        /// GET /api/customers/{id}
        /// Returns customer detail with orders, invoices, and transactions.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDetailDto>> GetCustomer(string id)
        {
            if (!int.TryParse(id, out var customerId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerID == customerId);

            if (customer == null)
            {
                return NotFound(new { error = $"Resource 'Customer' with identifier '{customerId}' was not found" });
            }

            var orderCount = await _context.Orders
                .Where(o => o.CustomerID == customerId)
                .CountAsync();

            var invoiceCount = await _context.Invoices
                .Where(i => i.CustomerID == customerId)
                .CountAsync();

            var outstandingBalance = await _context.CustomerTransactions
                .Where(ct => ct.CustomerID == customerId)
                .SumAsync(ct => ct.OutstandingBalance);

            var recentOrders = await _context.Orders
                .Where(o => o.CustomerID == customerId)
                .OrderByDescending(o => o.OrderDate)
                .Take(10)
                .Select(o => new OrderListDto
                {
                    OrderId = o.OrderID,
                    CustomerName = customer.CustomerName,
                    OrderDate = o.OrderDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate,
                    LineCount = o.OrderLines.Count(),
                    TotalAmount = o.OrderLines.Sum(ol => ol.Quantity * ol.UnitPrice)
                })
                .ToListAsync();

            var recentTransactions = await _context.CustomerTransactions
                .Where(ct => ct.CustomerID == customerId)
                .OrderByDescending(ct => ct.TransactionDate)
                .Take(10)
                .Select(ct => new CustomerTransactionDto
                {
                    CustomerTransactionId = ct.CustomerTransactionID,
                    TransactionDate = ct.TransactionDate,
                    TransactionAmount = ct.TransactionAmount,
                    OutstandingBalance = ct.OutstandingBalance
                })
                .ToListAsync();

            var detail = new CustomerDetailDto
            {
                CustomerId = customer.CustomerID,
                CustomerName = customer.CustomerName,
                CreditLimit = customer.CreditLimit,
                OrderCount = orderCount,
                InvoiceCount = invoiceCount,
                OutstandingBalance = outstandingBalance,
                RecentOrders = recentOrders,
                RecentTransactions = recentTransactions
            };

            return Ok(detail);
        }
    }
}
