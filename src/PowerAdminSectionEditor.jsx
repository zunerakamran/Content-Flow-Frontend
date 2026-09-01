import { useParams, useNavigate } from 'react-router-dom'
import AdvisorDashboard from './AdvisorDashboard'

export default function PowerAdminSectionEditor() {
    const { deploymentId } = useParams()
    const navigate = useNavigate()

    return (
        <AdvisorDashboard
            powerAdminDeploymentId={Number(deploymentId)}
            onExitPowerAdmin={() => navigate('/power_admin')}
        />
    )
}
