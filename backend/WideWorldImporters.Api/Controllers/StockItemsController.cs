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

            // Single joined query: StockItems → StockItemHoldings → Suppliers
            var query = _context.StockItems
                .Join(_context.StockItemHoldings,
                    si => si.StockItemID, h => h.StockItemID,
                    (si, h) => new { StockItem = si, Holding = h })
                .Join(_context.Suppliers,
                    x => x.StockItem.SupplierID, sup => sup.SupplierID,
                    (x, sup) => new { x.StockItem, x.Holding, Supplier = sup });

            if (!string.IsNullOrWhiteSpace(supplierId))
            {
                var ids = supplierId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(x => ids.Contains(x.StockItem.SupplierID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.StockItem.StockItemName.Contains(search) || x.Supplier.SupplierName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            // Apply sort (supports all original columns + quantityonhand/suppliername)
            var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            var sorted = sortBy?.ToLowerInvariant() switch
            {
                "stockitemid" => desc ? query.OrderByDescending(x => x.StockItem.StockItemID) : query.OrderBy(x => x.StockItem.StockItemID),
                "stockitemname" => desc ? query.OrderByDescending(x => x.StockItem.StockItemName) : query.OrderBy(x => x.StockItem.StockItemName),
                "unitprice" => desc ? query.OrderByDescending(x => x.StockItem.UnitPrice) : query.OrderBy(x => x.StockItem.UnitPrice),
                "recommendedretailprice" => desc ? query.OrderByDescending(x => x.StockItem.RecommendedRetailPrice) : query.OrderBy(x => x.StockItem.RecommendedRetailPrice),
                "quantityonhand" => desc ? query.OrderByDescending(x => x.Holding.QuantityOnHand) : query.OrderBy(x => x.Holding.QuantityOnHand),
                "suppliername" => desc ? query.OrderByDescending(x => x.Supplier.SupplierName) : query.OrderBy(x => x.Supplier.SupplierName),
                _ => query.OrderBy(x => x.StockItem.StockItemName)
            };

            List<StockItemListDto> data;
            if (export)
            {
                const int ExportRowLimit = 50_000;
                if (totalCount > ExportRowLimit)
                    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
                _context.Database.SetCommandTimeout(120);
                data = await sorted.Select(x => new StockItemListDto
                {
                    StockItemId = x.StockItem.StockItemID,
                    StockItemName = x.StockItem.StockItemName,
                    SupplierName = x.Supplier.SupplierName,
                    UnitPrice = x.StockItem.UnitPrice,
                    RecommendedRetailPrice = x.StockItem.RecommendedRetailPrice,
                    QuantityOnHand = x.Holding.QuantityOnHand
                }).ToListAsync();
            }
            else
            {
                data = await sorted.Skip((page - 1) * pageSize).Take(pageSize).Select(x => new StockItemListDto
                {
                    StockItemId = x.StockItem.StockItemID,
                    StockItemName = x.StockItem.StockItemName,
                    SupplierName = x.Supplier.SupplierName,
                    UnitPrice = x.StockItem.UnitPrice,
                    RecommendedRetailPrice = x.StockItem.RecommendedRetailPrice,
                    QuantityOnHand = x.Holding.QuantityOnHand
                }).ToListAsync();
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
    }
}
