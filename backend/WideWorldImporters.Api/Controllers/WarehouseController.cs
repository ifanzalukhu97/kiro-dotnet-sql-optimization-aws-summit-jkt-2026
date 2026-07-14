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
            [FromQuery] int? stockItemId = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.StockItemTransactions
                .Include(t => t.StockItem)
                    .ThenInclude(si => si.StockItemHolding)
                .AsQueryable();

            if (stockItemId.HasValue)
            {
                query = query.Where(t => t.StockItemID == stockItemId.Value);
            }

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderByDescending(t => t.TransactionOccurredWhen)
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
    }
}
