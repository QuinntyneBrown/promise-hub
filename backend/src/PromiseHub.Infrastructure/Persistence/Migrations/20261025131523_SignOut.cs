using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SignOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CollectedBy",
                table: "AttendanceRecords",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CollectorGuardianId",
                table: "AttendanceRecords",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ConfirmedByPhone",
                table: "AttendanceRecords",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IdChecked",
                table: "AttendanceRecords",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SignedOutAt",
                table: "AttendanceRecords",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CollectedBy",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "CollectorGuardianId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ConfirmedByPhone",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "IdChecked",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "SignedOutAt",
                table: "AttendanceRecords");
        }
    }
}
