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
            [FromQuery] string customerId = null,
            [FromQuery] string stockItemId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null,
            [FromQuery] bool export = false)
        {
            if (!export)
            {
                if (pageSize < 1) pageSize = 1;
                if (pageSize > 100) pageSize = 100;
            }
            if (page < 1) page = 1;

            var query = _context.Orders
                .Include(o => o.Customer)
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
                    query = query.Where(o => ids.Contains(o.CustomerID));
                }
            }

            if (!string.IsNullOrWhiteSpace(stockItemId))
            {
                var ids = stockItemId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(o => o.OrderLines.Any(ol => ids.Contains(ol.StockItemID)));
                }
            }

            if (startDate.HasValue)
            {
                query = query.Where(o => o.OrderDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(o => o.OrderDate <= endDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(o => o.Customer.CustomerName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var sorted = ApplySort(query, sortBy, sortDirection);
            List<Order> orders;
            if (export)
            {
                const int ExportRowLimit = 50_000;
                if (totalCount > ExportRowLimit)
                    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
                _context.Database.SetCommandTimeout(120);
                orders = await sorted.ToListAsync();
            }
            else
            {
                orders = await sorted.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            }

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

            var stockItemIds = order.OrderLines.Select(ol => ol.StockItemID).Distinct().ToList();
            var stockItems = await _context.StockItems
                .Where(si => stockItemIds.Contains(si.StockItemID))
                .ToDictionaryAsync(si => si.StockItemID, si => si.StockItemName);

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
                    UnitPrice = ol.UnitPrice,
                    StockItemName = stockItems.GetValueOrDefault(ol.StockItemID, ""),
                    TotalPrice = ol.Quantity * ol.UnitPrice
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

        private static IQueryable<Order> ApplySort(IQueryable<Order> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "orderid" => desc ? query.OrderByDescending(o => o.OrderID) : query.OrderBy(o => o.OrderID),
                "orderdate" => desc ? query.OrderByDescending(o => o.OrderDate) : query.OrderBy(o => o.OrderDate),
                "expecteddeliverydate" => desc ? query.OrderByDescending(o => o.ExpectedDeliveryDate) : query.OrderBy(o => o.ExpectedDeliveryDate),
                "customername" => desc ? query.OrderByDescending(o => o.Customer.CustomerName) : query.OrderBy(o => o.Customer.CustomerName),
                _ => query.OrderByDescending(o => o.OrderDate) // default sort
            };
        }
    }
}
