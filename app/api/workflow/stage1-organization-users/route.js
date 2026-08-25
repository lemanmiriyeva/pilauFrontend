import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request) {
    const {searchParams} = new URL(request.url);
    const docType = searchParams.get("doc_type");

    if (!docType) {
        return NextResponse.json({detail: "doc_type tələb olunur."}, {status: 400});
    }

    const access = cookies().get("access");
    const refresh = cookies().get("refresh");

    try {
        const endpoint = `${DJANGO_API_ENDPOINTS.WORKFLOW.STAGE1_ORGANIZATION_USERS}?doc_type=${encodeURIComponent(docType)}`;

        const res = await get_request(endpoint, access, refresh);
        const data = await res.json();

        return NextResponse.json(data, {
            status: res.status,
        });
    } catch (e) {
        console.error("stage1-organization-users route error:", e);

        return NextResponse.json({
            detail: handleError(e),
        }, {status: 500});
    }
}