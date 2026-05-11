
const API_BASE_URL = "http://localhost:5000/api/V1";



function readSession() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function writeSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}


const apiRequest = async (path, options = {}) => {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        });
    } catch {
        throw new Error("Unable to reach backend. Please start the server and try again.");
    }

    const rawText = await response.text();
    let payload = {};

    try {
        payload = rawText ? JSON.parse(rawText) : {};
    } catch {
        payload = { message: rawText || "Unexpected server response" };
    }

    if (!response.ok) {
        const message = payload.message || "Request failed";
        const normalized = String(message).toLowerCase();

        if (
            normalized.includes("serverselection")
            || normalized.includes("mongodb")
            || normalized.includes("buffering timed out")
            || normalized.includes("no primary")
            || normalized.includes("could not connect to any servers")
        ) {
            throw new Error(DATABASE_OFFLINE_MESSAGE);
        }

        throw new Error(message);
    }

    return payload;
};

menuBtn.addEventListener("click", () => {
   navLinks.classList.toggle("open");

     const isOpen = navLinks.classList.contains("open");
   menuBtnIcon.setAttribute("class", isOpen? "ri-menu-3-line":"ri-menu-3-line");
});


navLinks.addEventListener("click", () => {
   navLinks.classList.remove("open");
     menuBtnIcon.setAttribute("class", "ri-menu-3-line");
});



const scrollRevealOption = {
    origin:"bottom",
    distance:"50px",
    duration: 1000,
};


//header_container
ScrollReveal().reveal(".header_content p",{
 ...scrollRevealOption,

});

ScrollReveal().reveal(".header_content h1",{
 ...scrollRevealOption,
 delay: 500,
});

ScrollReveal().reveal(".header_content .header_btn",{
 ...scrollRevealOption,
 delay: 1000,
});


ScrollReveal().reveal(".blog_card",{
 ...scrollRevealOption,
 delay: 500,
});


const instagram = document.querySelector(".instagram_flex");

const instagramContent = Array.from(instagram.children);
instagramContent.forEach(item => {
    const duplicateNode = item.cloneNode(true);
    duplicateNode.setAttribute("aria-hidder", true);
    instagram.appendChild(duplicateNode);
});

showSignupBtn?.addEventListener("click", () => {
    scrollToMemberHub();
    document.getElementById("signup-username")?.focus();
});

const promptSigninForJoin = (program) => {
    pendingJoinProgram = program;
    pendingMemberSigninProgram = null;
    scrollToMemberHub();
    existingAccountCallout?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("signin-email")?.focus();
    setStatus(memberFeedback, `Please sign in to continue your ${program} join request. If you do not have an account yet, create one first.`, "error");
    setStatus(authStatus, `${program} request is pending. Sign in to send the email request.`, "success");
};

ctaButtons.forEach((button) => {
    button.addEventListener("click", () => {
        scrollToMemberHub();

        if (button.id === "book-elite-cta") {
            const session = readSession();
            if (!session?.user) {
                setStatus(memberFeedback, "Sign in first to view your Standard Premium account.", "success");
            }
        }
    });
});

signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(authStatus, "Creating your account...", "success");

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    try {
        const response = await apiRequest("/users/create", {
            method: "POST",
            body: JSON.stringify({ username, email, password }),
        });

        writeSession({
            token: null,
            hasEmailToken: false,
            signinStatus: "Account created (not yet signed in)",
            awaitingToken: false,
            joinRequestProgram: null,
            showAccountCreatedNote: true,
            showFirstTimeLoyaltyCard: true,
            user: {
                ...response.user,
                accountType: response.user?.accountType || "standard_premium",
            },
        });

        updateMemberUI();
    scheduleAccountCreatedNoteAutoHide();
        setStatus(authStatus, "Account created successfully.", "success");
        setStatus(memberFeedback, "", "");
        signupForm.reset();
    } catch (error) {
        setStatus(authStatus, error.message, "error");
    }
});

signinForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const canProceed = await refreshBackendHealth({ showMessage: true });
    if (!canProceed) {
        return;
    }

    setStatus(authStatus, "Signing in...", "success");

    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value;
    const requestedMemberProgram = pendingMemberSigninProgram;

    try {
        const response = await apiRequest("/users/signin", {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                ...(requestedMemberProgram ? { program: requestedMemberProgram } : {}),
            }),
        });

        writeSession({
            token: response.token || null,
            signinStatus: `Sign in successful (${new Date().toLocaleString()})`,
            awaitingToken: false,
            joinRequestProgram: null,
            showAccountCreatedNote: false,
            showFirstTimeLoyaltyCard: false,
            memberProgramSignin: requestedMemberProgram || null,
            user: {
                ...response.user,
                accountType: response.user?.accountType || "standard_premium",
            },
        });

        const signedInAccountType = response.user?.accountType || "standard_premium";
    clearAccountCreatedNoteTimer();

        if (requestedMemberProgram) {
            pendingMemberSigninProgram = null;
            updateMemberUI();
            setStatus(authStatus, `${requestedMemberProgram} member sign in successful. Your benefits are now active.`, "success");
            setStatus(memberFeedback, "", "");
            signinForm.reset();
            return;
        }

        updateMemberUI();
        setStatus(authStatus, "Sign in successful. Account information is now visible.", "success");

        const signedInSession = readSession();
        if (pendingJoinProgram) {
            const requestedProgram = pendingJoinProgram;
            pendingJoinProgram = null;
            try {
                await openJoinRequestEmail(requestedProgram, signedInSession);
                writeSession({ ...signedInSession, awaitingToken: true, joinRequestProgram: requestedProgram });
                updateMemberUI();
                setStatus(memberFeedback, `${requestedProgram} join request email sent to premiumecorentals2023@gmail.com.`, "success");
                setStatus(authStatus, `Signed in and ${requestedProgram} request sent.`, "success");
            } catch (error) {
                setStatus(memberFeedback, error.message, "error");
                setStatus(authStatus, "Signed in, but join request email failed.", "error");
            }
        } else {
            setStatus(memberFeedback, "Signed in successfully.", "success");
        }

        signinForm.reset();
    } catch (error) {
        setStatus(authStatus, error.message, "error");
    }
});

regularSigninForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const sourceEmail = regularSigninEmail?.value.trim() || "";
    const sourcePassword = regularSigninPassword?.value || "";

    const primarySigninEmail = document.getElementById("signin-email");
    const primarySigninPassword = document.getElementById("signin-password");

    if (primarySigninEmail) primarySigninEmail.value = sourceEmail;
    if (primarySigninPassword) primarySigninPassword.value = sourcePassword;

    pendingMemberSigninProgram = null;
    signinForm?.requestSubmit();
});

const joinEliteSuccessSection = document.getElementById("join-elite-success-section");
const signInEliteMemberBtn = document.getElementById("sign-in-elite-member-btn");
const joinEliteSigninPortal = document.getElementById("join-elite-signin-portal");
const eliteSigninForm = document.getElementById("elite-signin-form");

signInEliteMemberBtn?.addEventListener("click", () => {
    if (joinEliteSigninPortal) {
        joinEliteSigninPortal.hidden = !joinEliteSigninPortal.hidden;
        joinEliteSigninPortal.style.display = joinEliteSigninPortal.hidden ? "none" : "";
        
        // Pre-fill email from session if available
        if (!joinEliteSigninPortal.hidden) {
            const session = readSession();
            const emailInput = eliteSigninForm?.querySelector('input[type="email"]');
            if (emailInput && session?.user?.email) {
                emailInput.value = session.user.email;
            }
        }
    }
});

eliteSigninForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const email = eliteSigninForm.querySelector('input[type="email"]')?.value.trim() || "";
    const password = eliteSigninForm.querySelector('input[type="password"]')?.value || "";
    
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
    
    try {
        const response = await fetch("http://localhost:5000/api/V1/users/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, program: "Elite" })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            const session = readSession();
            writeSession({
                ...session,
                token: data.token,
                memberProgramSignin: true,
                signinStatus: "Sign in successful",
                user: {
                    ...session.user,
                    accountType: "elite"
                }
            });
            alert("Elite sign in successful!");
            eliteSigninForm.reset();
            if (joinEliteSigninPortal) {
                joinEliteSigninPortal.hidden = true;
                joinEliteSigninPortal.style.display = "none";
            }
            updateMemberUI();
        } else {
            alert(data?.message || "Elite sign in failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Elite sign-in error:", error);
        alert("Error during sign in: " + error.message);
    }
});

joinLoyaltyBtn?.addEventListener("click", async () => {
    const session = readSession();

    if (!session?.user) {
        promptSigninForJoin("Loyalty");
        return;
    }

    const existingType = session.user.accountType;
    if (existingType === "loyalty" || existingType === "elite") {
        setStatus(memberFeedback, `You already have a ${existingType} account. Use "Sign in as ${existingType === "elite" ? "Elite" : "Loyalty"} Member" to access it.`, "error");
        return;
    }

    pendingJoinProgram = null;
    try {
        await openJoinRequestEmail("Loyalty", session);
        writeSession({ ...session, awaitingToken: true, joinRequestProgram: "Loyalty" });
        updateMemberUI();
        setStatus(memberFeedback, "Loyalty join request email sent to premiumecorentals2023@gmail.com.", "success");
    } catch (error) {
        setStatus(memberFeedback, error.message, "error");
    }
});

joinEliteBtn?.addEventListener("click", async () => {
    const session = readSession();

    if (!session?.user) {
        promptSigninForJoin("Elite");
        return;
    }

    const existingType = session.user.accountType;
    if (existingType === "elite") {
        setStatus(memberFeedback, "You already have an elite account. Use 'Sign in as Elite Member' to access it.", "info");
        return;
    }
    if (existingType === "loyalty") {
        setStatus(memberFeedback, "You already have a loyalty account. Use the sign in flow to access your loyalty membership.", "info");
        return;
    }

    pendingJoinProgram = null;
    try {
        await openJoinRequestEmail("Elite", session);
        writeSession({ ...session, awaitingToken: true, joinRequestProgram: "Elite" });
        updateMemberUI();
        setStatus(memberFeedback, "Elite join request email sent to premiumecorentals2023@gmail.com.", "success");
    } catch (error) {
        setStatus(memberFeedback, error.message, "error");
    }
});

regularJoinEliteBtn?.addEventListener("click", () => {
    joinEliteBtn?.click();
});

firstTimeJoinLoyaltyBtn?.addEventListener("click", () => {
    joinLoyaltyBtn?.click();
});

regularJoinLoyaltyBtn?.addEventListener("click", () => {
    joinLoyaltyBtn?.click();
});

if (rewardsSigninLoyaltyBtn) {
    console.log("Attaching click handler to rewards-signin-loyalty-btn");
    rewardsSigninLoyaltyBtn.addEventListener("click", () => {
        console.log("rewards-signin-loyalty-btn clicked");
        startMemberProgramSignin("Loyalty");
    });
} else {
    console.warn("rewards-signin-loyalty-btn not found!");
}

if (rewardsSigninEliteBtn) {
    console.log("Attaching click handler to rewards-signin-elite-btn");
    rewardsSigninEliteBtn.addEventListener("click", () => {
        console.log("rewards-signin-elite-btn clicked");
        startMemberProgramSignin("Elite");
    });
} else {
    console.warn("rewards-signin-elite-btn not found!");
}

document.addEventListener("click", (event) => {
    const loyaltyButton = event.target.closest("#rewards-signin-loyalty-btn");
    const eliteButton = event.target.closest("#rewards-signin-elite-btn");

    if (loyaltyButton) {
        startMemberProgramSignin("Loyalty");
    }

    if (eliteButton) {
        startMemberProgramSignin("Elite");
    }
});

previewForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const session = readSession();
    const hasProgramAccess = Boolean(session?.token) && (session?.user?.accountType === "elite" || session?.user?.accountType === "loyalty");

    if (!hasProgramAccess) {
        setStatus(pointsStatus, "Points preview is locked until you complete member sign in with your ID and token.", "error");
        return;
    }

    setStatus(pointsStatus, "Calculating your preview...", "success");

    const eligibleSpend = Number(document.getElementById("preview-spend").value);
    const tier = document.getElementById("preview-tier").value;
    const baseRate = Number(document.getElementById("preview-base-rate").value);

    try {
        const response = await apiRequest("/loyalty/preview", {
            method: "POST",
            body: JSON.stringify({ eligibleSpend, tier, baseRate }),
        });

        previewPoints.textContent = response.data.points;
        previewMultiplier.textContent = response.data.multiplier;
        previewFormula.textContent = response.data.formula;
        setStatus(pointsStatus, "Preview updated.", "success");
    } catch (error) {
        setStatus(pointsStatus, error.message, "error");
    }
});

earnPointsBtn?.addEventListener("click", async () => {
    const session = readSession();

    if (!session?.user?._id) {
        scrollToMemberHub();
        setStatus(pointsStatus, "Sign in first to view your Standard Premium account.", "error");
        return;
    }

    if (!session.token) {
        setStatus(pointsStatus, "Earning points is locked until your email login token is issued.", "error");
        return;
    }

    const eligibleSpend = Number(document.getElementById("preview-spend").value);
    const baseRate = Number(document.getElementById("preview-base-rate").value);

    setStatus(pointsStatus, "Sending your trip to the loyalty service...", "success");

    try {
        const response = await apiRequest("/loyalty/earn", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({
                userId: session.user._id,
                eligibleSpend,
                baseRate,
            }),
        });

        const updatedSession = {
            ...session,
            user: {
                ...session.user,
                accountType: response.data.tier === "Bronze" ? session.user.accountType : session.user.accountType || "loyalty",
            },
        };

        writeSession(updatedSession);
        updateMemberUI();
        setStatus(pointsStatus, `Success: ${response.data.pointsEarned} points earned. Current tier: ${response.data.tier}.`, "success");
    } catch (error) {
        setStatus(pointsStatus, error.message, "error");
    }
});

const handleLogout = () => {
    pendingJoinProgram = null;
    pendingMemberSigninProgram = null;
    clearAccountCreatedNoteTimer();
    clearSession();
    // Hard reload to guarantee UI reset and session clear
    window.location.reload();
};

logoutBtn?.addEventListener("click", handleLogout);
memberHubLogoutBtn?.addEventListener("click", handleLogout);
regularJoinEliteLogoutBtn?.addEventListener("click", handleLogout);

tokenForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const session = readSession();
    const usernameInput = document.getElementById("user-login-username")?.value?.trim();
    const passwordInput = document.getElementById("user-login-password")?.value?.trim();
    const tokenInput = document.getElementById("user-login-token")?.value?.trim();
    const unlockIdInput = document.getElementById("user-unlock-id")?.value?.trim();

    if (!usernameInput || !passwordInput || !tokenInput || !unlockIdInput) {
        setStatus(authStatus, "Please fill in your username, password, login ID/token, and unlock ID.", "error");
        return;
    }

    setStatus(authStatus, "Verifying credentials...", "success");

    apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({
            username: usernameInput,
            password: passwordInput,
            loginToken: tokenInput,
            unlockId: unlockIdInput,
        }),
    })
        .then((response) => {
            writeSession({
                token: response.token,
                awaitingToken: false,
                joinRequestProgram: null,
                showAccountCreatedNote: false,
                showFirstTimeLoyaltyCard: false,
                memberProgramSignin: null,
                signinStatus: `Sign in successful (${new Date().toLocaleString()})`,
                user: {
                    ...response.user,
                },
            });

            updateMemberUI();
            clearAccountCreatedNoteTimer();
            setStatus(authStatus, "Login token accepted. You are now signed in.", "success");
            setStatus(memberFeedback, "Signed in through user login route.", "success");
            tokenForm.reset();
        })
        .catch((error) => {
            const message = error?.message || "Invalid login token.";
            const isExpired = /expired/i.test(message);

            if (isExpired) {
                const currentSession = readSession();
                if (currentSession?.user) {
                    writeSession({
                        ...currentSession,
                        token: null,
                        awaitingToken: false,
                        joinRequestProgram: null,
                        signinStatus: "Session token expired. Sign in to request a new token/password.",
                    });
                }
                setTokenEntryMode(false);
                updateMemberUI();
                setStatus(authStatus, "Token expired (24h). Request a new join email and use the new Login ID/Unlock ID.", "error");
                setStatus(memberFeedback, "Previous access IDs expired. Sign in again, then use Request New Token/Password.", "error");
                document.getElementById("signin-email")?.focus();
                return;
            }

            setStatus(authStatus, message, "error");
        });
});

updateMemberUI();
refreshBackendHealth();
// ...existing code...

// HERO SLIDER and all related legacy hero/slide/reveal code removed as requested.















