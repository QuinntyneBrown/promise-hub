using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondSignerTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondSignerTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    IssuedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondSignerTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondSignerTokens_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondSignerTokens_OrganizationId",
                table: "LearningBondSignerTokens",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondSignerTokens_RequestId",
                table: "LearningBondSignerTokens",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondSignerTokens_TokenHash",
                table: "LearningBondSignerTokens",
                column: "TokenHash",
                unique: true);

            // Each request's current link, issued before this table existed, keeps working.
            migrationBuilder.Sql(
                "INSERT INTO LearningBondSignerTokens (Id, OrganizationId, RequestId, TokenHash, IssuedAt) "
                + "SELECT Id, OrganizationId, Id, TokenHash, SentAt FROM LearningBondSignerRequests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondSignerTokens");
        }
    }
}
