using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "DeletedAt",
                table: "Households",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "Households",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "PurgeAfter",
                table: "Households",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Allergies",
                table: "Children",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Conditions",
                table: "Children",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateOfBirth",
                table: "Children",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DeletedAt",
                table: "Children",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Doctor",
                table: "Children",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "MedicalUpdatedAt",
                table: "Children",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicalUpdatedBy",
                table: "Children",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Medication",
                table: "Children",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RedAlert",
                table: "Children",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "School",
                table: "Children",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Guardians",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Relationship = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Mobile = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: true),
                    Language = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanPickUp = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanSign = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailBounced = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Guardians", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Guardians_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Guardians_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Guardians_HouseholdId",
                table: "Guardians",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_Guardians_OrganizationId",
                table: "Guardians",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Guardians");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "PurgeAfter",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "Allergies",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "Conditions",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "Doctor",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "MedicalUpdatedAt",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "MedicalUpdatedBy",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "Medication",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "RedAlert",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "School",
                table: "Children");
        }
    }
}
