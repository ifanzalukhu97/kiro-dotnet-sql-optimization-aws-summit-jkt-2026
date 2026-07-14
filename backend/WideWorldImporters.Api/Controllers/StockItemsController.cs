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
            [FromQuery] int? supplierId = null)
        {
            if (pageSize > 100) pageSize = 100;
            if (pageSize < 1) pageSize = 20;
            if (page < 1) page = 1;

            var query = _context.StockItems.AsQueryable();

            if (supplierId.HasValue)
            {
                query = query.Where(s => s.SupplierID == supplierId.Value);
            }

            var totalCount = await query.CountAsync();

            // SELECT * pattern: load entire entities with all columns
            var stockItems = await query
                .OrderBy(s => s.StockItemName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

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
    }
}
