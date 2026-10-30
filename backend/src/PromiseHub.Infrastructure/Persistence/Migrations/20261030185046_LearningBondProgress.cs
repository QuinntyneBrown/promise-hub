using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepositAmount",
                table: "LearningBondApplications",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DepositedAt",
                table: "LearningBondApplications",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReceivedAt",
                table: "LearningBondApplications",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LearningBondDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    RequestedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    StorageKey = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    UploadedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondDocuments_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondDocuments_OrganizationId",
                table: "LearningBondDocuments",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondDocuments_OrganizationId_ApplicationId",
                table: "LearningBondDocuments",
                columns: new[] { "OrganizationId", "ApplicationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondDocuments");

            migrationBuilder.DropColumn(
                name: "DepositAmount",
                table: "LearningBondApplications");

            migrationBuilder.DropColumn(
                name: "DepositedAt",
                table: "LearningBondApplications");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "LearningBondApplications");
        }
    }
}
