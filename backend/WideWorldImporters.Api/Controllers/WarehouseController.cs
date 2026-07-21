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
    public class WarehouseController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public WarehouseController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<WarehouseTransactionListDto>>> GetTransactions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string stockItemId = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.StockItemTransactions
                .Include(t => t.StockItem)
                    .ThenInclude(si => si.StockItemHolding)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(stockItemId))
            {
                var ids = stockItemId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(t => ids.Contains(t.StockItemID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(t => t.StockItem.StockItemName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var data = await ApplySort(query, sortBy, sortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new WarehouseTransactionListDto
                {
                    StockItemTransactionId = t.StockItemTransactionID,
                    StockItemName = t.StockItem.StockItemName,
                    TransactionOccurredWhen = t.TransactionOccurredWhen,
                    Quantity = t.Quantity,
                    QuantityOnHand = t.StockItem.StockItemHolding != null ? t.StockItem.StockItemHolding.QuantityOnHand : 0
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<WarehouseTransactionListDto>
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseTransactionDetailDto>> GetTransaction(string id)
        {
            if (!int.TryParse(id, out var transactionId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var transaction = await _context.StockItemTransactions
                .Include(t => t.StockItem)
                    .ThenInclude(si => si.StockItemHolding)
                .FirstOrDefaultAsync(t => t.StockItemTransactionID == transactionId);

            if (transaction == null)
            {
                return NotFound(new { error = $"Resource 'WarehouseTransaction' with identifier '{transactionId}' was not found" });
            }

            var detail = new WarehouseTransactionDetailDto
            {
                StockItemTransactionId = transaction.StockItemTransactionID,
                StockItemId = transaction.StockItemID,
                StockItemName = transaction.StockItem?.StockItemName ?? string.Empty,
                TransactionOccurredWhen = transaction.TransactionOccurredWhen,
                Quantity = transaction.Quantity,
                QuantityOnHand = transaction.StockItem?.StockItemHolding?.QuantityOnHand ?? 0,
                ReorderLevel = transaction.StockItem?.StockItemHolding?.ReorderLevel ?? 0,
                TargetStockLevel = transaction.StockItem?.StockItemHolding?.TargetStockLevel ?? 0
            };

            return Ok(detail);
        }

        private static IQueryable<StockItemTransaction> ApplySort(IQueryable<StockItemTransaction> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "stockitemtransactionid" => desc ? query.OrderByDescending(t => t.StockItemTransactionID) : query.OrderBy(t => t.StockItemTransactionID),
                "stockitemname" => desc ? query.OrderByDescending(t => t.StockItem.StockItemName) : query.OrderBy(t => t.StockItem.StockItemName),
                "transactionoccurredwhen" => desc ? query.OrderByDescending(t => t.TransactionOccurredWhen) : query.OrderBy(t => t.TransactionOccurredWhen),
                "quantity" => desc ? query.OrderByDescending(t => t.Quantity) : query.OrderBy(t => t.Quantity),
                _ => query.OrderByDescending(t => t.TransactionOccurredWhen) // default sort
            };
        }
    }
}
