import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ImportExportOutlinedIcon from '@mui/icons-material/ImportExportOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';

const ICON_MAP = {
    description: DescriptionOutlinedIcon,
    assessment: AssessmentOutlinedIcon,
    apartment: ApartmentOutlinedIcon,
    manage_accounts: ManageAccountsOutlinedIcon,
    gavel: GavelOutlinedIcon,
    local_shipping: LocalShippingOutlinedIcon,
    import_export: ImportExportOutlinedIcon,
    percent: PercentOutlinedIcon,
    swap_horiz: SwapHorizOutlinedIcon,
    fact_check: FactCheckOutlinedIcon,
};

export function getModuleIcon(key) {
    return ICON_MAP[key] || DescriptionOutlinedIcon;
}