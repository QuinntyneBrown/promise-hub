using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondSignerAcceptances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "AcceptedByMembershipId",
                table: "LearningBondAgreementAcceptances",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "TEXT");

            migrationBuilder.AddColumn<string>(
                name: "SignerEmail",
                table: "LearningBondAgreementAcceptances",
                type: "TEXT",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignerTitle",
                table: "LearningBondAgreementAcceptances",
                type: "TEXT",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SignerEmail",
                table: "LearningBondAgreementAcceptances");

            migrationBuilder.DropColumn(
                name: "SignerTitle",
                table: "LearningBondAgreementAcceptances");

            migrationBuilder.AlterColumn<Guid>(
                name: "AcceptedByMembershipId",
                table: "LearningBondAgreementAcceptances",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
