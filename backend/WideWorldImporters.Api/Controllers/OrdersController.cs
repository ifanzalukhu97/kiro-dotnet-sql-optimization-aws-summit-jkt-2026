using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;

namespace WideWorldImporters.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public OrdersController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<OrderListDto>>> GetOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? customerId = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.Orders
                .Include(o => o.Customer)
                .AsQueryable();

            if (customerId.HasValue)
            {
                query = query.Where(o => o.CustomerID == customerId.Value);
            }

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var orderDtos = new List<OrderListDto>();

            foreach (var order in orders)
            {
                var lines = await _context.OrderLines
                    .Where(ol => ol.OrderID == order.OrderID)
                    .ToListAsync();

                orderDtos.Add(new OrderListDto
                {
                    OrderId = order.OrderID,
                    CustomerName = order.Customer.CustomerName,
                    OrderDate = order.OrderDate,
                    ExpectedDeliveryDate = order.ExpectedDeliveryDate,
                    LineCount = lines.Count,
                    TotalAmount = lines.Sum(l => l.Quantity * l.UnitPrice)
                });
            }

            return Ok(new PaginatedResponse<OrderListDto>
            {
                Data = orderDtos,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDetailDto>> GetOrder(string id)
        {
            if (!int.TryParse(id, out var orderId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderLines)
                .FirstOrDefaultAsync(o => o.OrderID == orderId);

            if (order == null)
            {
                return NotFound(new { error = $"Resource 'Order' with identifier '{orderId}' was not found" });
            }

            var dto = new OrderDetailDto
            {
                OrderId = order.OrderID,
                CustomerName = order.Customer.CustomerName,
                OrderDate = order.OrderDate,
                ExpectedDeliveryDate = order.ExpectedDeliveryDate,
                IsUndersupplyBackordered = order.IsUndersupplyBackordered,
                Lines = order.OrderLines.Select(ol => new OrderLineDto
                {
                    OrderLineId = ol.OrderLineID,
                    StockItemId = ol.StockItemID,
                    Description = ol.Description,
                    Quantity = ol.Quantity,
                    UnitPrice = ol.UnitPrice
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpGet("lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetCustomersLookup()
        {
            var customers = await _context.Customers
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
