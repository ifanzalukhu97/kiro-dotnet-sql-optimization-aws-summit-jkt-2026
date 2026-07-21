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
    [Route("api/stockitems")]
    public class StockItemsController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public StockItemsController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<StockItemListDto>>> GetStockItems(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string supplierId = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null,
            [FromQuery] bool export = false)
        {
            if (!export)
            {
                if (pageSize > 100) pageSize = 100;
                if (pageSize < 1) pageSize = 20;
            }
            if (page < 1) page = 1;

            var query = _context.StockItems.AsQueryable();

            if (!string.IsNullOrWhiteSpace(supplierId))
            {
                var ids = supplierId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(s => ids.Contains(s.SupplierID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(s => s.StockItemName.Contains(search) || s.Supplier.SupplierName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            // SELECT * pattern: load entire entities with all columns
            var sorted = ApplySort(query, sortBy, sortDirection);
            List<StockItem> stockItems;
            if (export)
            {
                const int ExportRowLimit = 50_000;
                if (totalCount > ExportRowLimit)
                    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
                _context.Database.SetCommandTimeout(120);
                stockItems = await sorted.ToListAsync();
            }
            else
            {
                stockItems = await sorted.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            }

            // Map to DTO which uses fewer than 50% of the loaded columns
            var data = stockItems.Select(s => new StockItemListDto
            {
                StockItemId = s.StockItemID,
                StockItemName = s.StockItemName,
                SupplierName = null,
                UnitPrice = s.UnitPrice,
                RecommendedRetailPrice = s.RecommendedRetailPrice,
                QuantityOnHand = 0
            }).ToList();

            // Load supplier names and holdings separately (additional queries)
            foreach (var item in stockItems)
            {
                var dto = data.First(d => d.StockItemId == item.StockItemID);

                var supplier = await _context.Suppliers
                    .Where(sup => sup.SupplierID == item.SupplierID)
                    .FirstOrDefaultAsync();
                dto.SupplierName = supplier?.SupplierName;

                var holding = await _context.StockItemHoldings
                    .Where(h => h.StockItemID == item.StockItemID)
                    .FirstOrDefaultAsync();
                dto.QuantityOnHand = holding?.QuantityOnHand ?? 0;
            }

            return Ok(new PaginatedResponse<StockItemListDto>
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StockItemDetailDto>> GetStockItem(string id)
        {
            if (!int.TryParse(id, out var stockItemId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var stockItem = await _context.StockItems
                .Include(s => s.Supplier)
                .Include(s => s.StockItemHolding)
                .Include(s => s.StockItemStockGroups)
                    .ThenInclude(sg => sg.StockGroup)
                .FirstOrDefaultAsync(s => s.StockItemID == stockItemId);

            if (stockItem == null)
            {
                return NotFound(new { error = $"Resource 'StockItem' with identifier '{id}' was not found" });
            }

            var detail = new StockItemDetailDto
            {
                StockItemId = stockItem.StockItemID,
                StockItemName = stockItem.StockItemName,
                SupplierName = stockItem.Supplier?.SupplierName,
                UnitPrice = stockItem.UnitPrice,
                RecommendedRetailPrice = stockItem.RecommendedRetailPrice,
                TaxRate = stockItem.TaxRate,
                TypicalWeightPerUnit = stockItem.TypicalWeightPerUnit,
                QuantityOnHand = stockItem.StockItemHolding?.QuantityOnHand ?? 0,
                ReorderLevel = stockItem.StockItemHolding?.ReorderLevel ?? 0,
                TargetStockLevel = stockItem.StockItemHolding?.TargetStockLevel ?? 0,
                StockGroups = stockItem.StockItemStockGroups?
                    .Select(sg => sg.StockGroup?.StockGroupName)
                    .Where(name => name != null)
                    .ToList() ?? new List<string>()
            };

            return Ok(detail);
        }

        [HttpGet("lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetStockItemsLookup()
        {
            // Naive: load ALL stock items without pagination (full table scan)
            var stockItems = await _context.StockItems
                .OrderBy(s => s.StockItemName)
                .ToListAsync();

            var lookup = stockItems.Select(s => new LookupDto
            {
                Id = s.StockItemID,
                Name = s.StockItemName
            }).ToList();

            return Ok(lookup);
        }

        private static IQueryable<StockItem> ApplySort(IQueryable<StockItem> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "stockitemid" => desc ? query.OrderByDescending(s => s.StockItemID) : query.OrderBy(s => s.StockItemID),
                "stockitemname" => desc ? query.OrderByDescending(s => s.StockItemName) : query.OrderBy(s => s.StockItemName),
                "unitprice" => desc ? query.OrderByDescending(s => s.UnitPrice) : query.OrderBy(s => s.UnitPrice),
                "recommendedretailprice" => desc ? query.OrderByDescending(s => s.RecommendedRetailPrice) : query.OrderBy(s => s.RecommendedRetailPrice),
                _ => query.OrderBy(s => s.StockItemName) // default sort
            };
        }
    }
}
